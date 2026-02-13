import { describe, it, expect, vi, beforeEach } from 'vitest';

// ──────────────────────────────────────────────
// Mock setup (hoisted)
// ──────────────────────────────────────────────

const { mockPrisma, mockGetCurrentUser, mockHashPassword, mockVerifyPassword } = vi.hoisted(() => ({
    mockPrisma: {
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
    mockGetCurrentUser: vi.fn(),
    mockHashPassword: vi.fn(),
    mockVerifyPassword: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth', () => ({
    getCurrentUser: mockGetCurrentUser,
    hashPassword: mockHashPassword,
    verifyPassword: mockVerifyPassword,
}));

// Import the route handler (we'll test it as a function)
import { POST } from '@/app/api/auth/change-password/route';

describe('Change Password API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('should reject unauthenticated requests', async () => {
        mockGetCurrentUser.mockResolvedValue(null);

        const request = new Request('http://localhost/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: 'old', newPassword: 'newPass123' }),
        });

        const response = await POST(request);
        expect(response.status).toBe(401);
    });

    it('should reject if current password is incorrect', async () => {
        mockGetCurrentUser.mockResolvedValue({ id: 'user-1', workspaceId: 'ws-1' });
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'user-1',
            passwordHash: 'hashed_old_password',
        });
        mockVerifyPassword.mockResolvedValue(false);

        const request = new Request('http://localhost/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: 'wrong', newPassword: 'newPass123' }),
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('incorrect');
    });

    it('should update password successfully', async () => {
        mockGetCurrentUser.mockResolvedValue({ id: 'user-1', workspaceId: 'ws-1' });
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'user-1',
            passwordHash: 'hashed_old_password',
        });
        mockVerifyPassword.mockResolvedValue(true);
        mockHashPassword.mockResolvedValue('hashed_new_password');
        mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });

        const request = new Request('http://localhost/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: 'oldPass123', newPassword: 'newPass123' }),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toContain('success');
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: { passwordHash: 'hashed_new_password' },
        });
    });

    it('should reject empty password fields', async () => {
        mockGetCurrentUser.mockResolvedValue({ id: 'user-1', workspaceId: 'ws-1' });

        const request = new Request('http://localhost/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: '', newPassword: '' }),
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
    });
});
