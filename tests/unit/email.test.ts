import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendEmail } from '@/lib/email';

// Mock Prisma
const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            integrationLog: { create: vi.fn() },
            alert: { create: vi.fn() },
        }
    };
});

vi.mock('@/lib/prisma', () => ({
    prisma: mockPrisma,
}));

// Mock process.env
const originalEnv = process.env;

describe('Email Utility (Strict Mode)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        process.env = { ...originalEnv, EMAIL_PASS: 'test-api-key' };

        // Mock global fetch
        global.fetch = vi.fn();
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should send email successfully on first attempt', async () => {
        // Mock successful fetch response
        (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ id: 'msg_123' }),
        });

        const result = await sendEmail({
            to: 'test@example.com',
            subject: 'Test Subject',
            html: '<p>Test</p>',
            workspaceId: 'ws-1',
        });

        expect(result).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Verify Logging (PRD Requirement: "Failures must be logged and visible" implies successes too ideally, or just logs in general)
        expect(mockPrisma.integrationLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                type: 'email',
                status: 'success',
                to: 'test@example.com',
                workspaceId: 'ws-1',
            }),
        });
    });

    it('should retry on failure and eventually succeed', async () => {
        // Mock 2 failures then 1 success
        (global.fetch as unknown as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ message: 'Server Error' }) })
            .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ message: 'Server Error' }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'msg_123' }) });

        const promise = sendEmail({
            to: 'test@example.com',
            subject: 'Test Retry',
            html: '<p>Retry</p>',
        });

        // Fast-forward retries
        await vi.runAllTimersAsync();

        const result = await promise;

        expect(result).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries, log failure, and create alert', async () => {
        // Mock configured failures > MAX_RETRIES (3)
        (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ message: 'Persistent Error' }),
        });

        const promise = sendEmail({
            to: 'fail@example.com',
            subject: 'Fail Subject',
            html: '<p>Fail</p>',
            workspaceId: 'ws-error',
        });

        await vi.runAllTimersAsync();

        const result = await promise;

        expect(result).toBe(false);
        expect(global.fetch).toHaveBeenCalledTimes(3);

        // Verify Log
        expect(mockPrisma.integrationLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                type: 'email',
                status: 'failed',
                error: expect.stringContaining('Persistent Error'),
                workspaceId: 'ws-error',
            }),
        });

        // Verify Alert (PRD Requirement: "Receive alerts when attention is required")
        expect(mockPrisma.alert.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                type: 'automation',
                title: 'Email Delivery Failed',
                workspaceId: 'ws-error',
            }),
        });
    });

    it('should fail immediately if API key is missing', async () => {
        process.env.EMAIL_PASS = '';

        const result = await sendEmail({
            to: 'test@example.com',
            subject: 'No Key',
            html: '<p>No Key</p>',
        });

        expect(result).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
