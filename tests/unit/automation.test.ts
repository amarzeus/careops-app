import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerAutomation } from '@/lib/automation';

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            workspace: { findUnique: vi.fn() },
            automationRule: { findMany: vi.fn() },
            conversation: { findUnique: vi.fn(), create: vi.fn() },
            message: { create: vi.fn() },
            alert: { create: vi.fn() },
            intakeForm: { findMany: vi.fn() },
            formSubmission: { create: vi.fn() },
        }
    };
});

vi.mock('@/lib/prisma', () => ({
    prisma: mockPrisma,
}));

vi.mock('@/lib/email', () => ({
    sendEmail: vi.fn(),
    buildEmailTemplate: vi.fn(() => "html"),
}));

vi.mock('@/lib/gemini', () => ({
    generateWelcomeMessage: vi.fn().mockResolvedValue("Welcome!"),
    generateBookingConfirmation: vi.fn().mockResolvedValue("Confirmed!"),
}));

describe('Automation Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock environment variables for email
        process.env.EMAIL_HOST = 'smtp.test.com';
        process.env.EMAIL_PORT = '587';
        process.env.EMAIL_USER = 'test';
        process.env.EMAIL_PASS = 'test';
        process.env.EMAIL_FROM = 'test@test.com';
    });

    it('should send welcome message on NEW_CONTACT', async () => {
        // Setup Mocks
        mockPrisma.workspace.findUnique.mockResolvedValue({ 
            id: 'ws-1', 
            status: 'ACTIVE', 
            name: 'Test Biz', 
            emailConfigured: true,
            smsConfigured: false
        });
        mockPrisma.automationRule.findMany.mockResolvedValue([{ id: 'rule-1', trigger: 'NEW_CONTACT', isActive: true }]);
        mockPrisma.conversation.findUnique.mockResolvedValue(null); // No conversation yet
        mockPrisma.conversation.create.mockResolvedValue({ id: 'conv-1', isActive: true });

        await triggerAutomation('ws-1', 'NEW_CONTACT', {
            contact: { id: 'c-1', name: 'John', email: 'john@example.com' }
        });

        // Assertions
        expect(mockPrisma.conversation.create).toHaveBeenCalled(); // Should create conversation
        expect(mockPrisma.message.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                content: "Welcome!",
                conversationId: 'conv-1'
            })
        });
    });

    it('should not run if workspace is inactive', async () => {
        mockPrisma.workspace.findUnique.mockResolvedValue({ id: 'ws-1', status: 'INACTIVE' });

        await triggerAutomation('ws-1', 'NEW_CONTACT', {});

        expect(mockPrisma.automationRule.findMany).not.toHaveBeenCalled();
    });
});
