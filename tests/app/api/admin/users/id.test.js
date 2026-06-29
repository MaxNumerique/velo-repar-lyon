import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH, DELETE } from '@/app/api/admin/users/[id]/route';
import prisma from '@/db/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockAdminSession, mockRestrictedSession } from 'tests/lib/api-test-utils';



vi.mock('@/db/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    repairRequest: {
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
    },
    bike: {
        deleteMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

describe('Admin User ID API (/api/admin/users/[id])', () => {
  const userId = 'user_123';
  const params = Promise.resolve({ id: userId });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PATCH', () => {
    it('updates user data and syncs with Clerk if necessary', async () => {
      const mockClerkId = 'clerk_123';
      const targetUser = { id: userId, clerkId: mockClerkId };
      mockAdminSession(clerk, prisma, {}, targetUser);
      
      const updateData = { firstName: 'Updated', role: 'ADMIN' };
      prisma.user.update.mockResolvedValue({ id: userId, ...updateData });

      const mockClerkClient = {
        users: {
          updateUser: vi.fn().mockResolvedValue({})
        }
      };
      clerk.clerkClient.mockResolvedValue(mockClerkClient);

      const req = createMockRequest({ method: 'PATCH', body: updateData });
      const res = await PATCH(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(mockClerkClient.users.updateUser).toHaveBeenCalledWith(mockClerkId, expect.objectContaining({
        firstName: 'Updated'
      }));
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: userId },
        data: expect.objectContaining({ role: 'ADMIN' })
      }));
      expect(data.firstName).toBe('Updated');
    });

    it('returns 400 on error', async () => {
        // Auth succeeds, but handler fails
        mockAdminSession(clerk, prisma); 
        // Overwrite the handler's call (the second findUnique call, or any call without clerkId)
        prisma.user.findUnique.mockImplementation(({ where }) => {
            if (where.clerkId) return Promise.resolve({ role: 'ADMIN' });
            return Promise.reject(new Error('DB Error'));
        });

        const req = createMockRequest({ method: 'PATCH', body: { firstName: 'Fail' } });
        const res = await PATCH(req, { params });

        expect(res.status).toBe(400);
    });
  });

  describe('DELETE', () => {
    it('deletes user and all related data in a transaction', async () => {
      const mockClerkId = 'clerk_123';
      const targetUser = { id: userId, clerkId: mockClerkId };
      mockAdminSession(clerk, prisma, {}, targetUser);
      
      // Setup transaction mocks
      prisma.repairRequest.updateMany.mockResolvedValue({ count: 0 });
      prisma.repairRequest.deleteMany.mockResolvedValue({ count: 0 });
      prisma.bike.deleteMany.mockResolvedValue({ count: 0 });
      prisma.user.delete.mockResolvedValue({});

      const mockClerkClient = {
        users: {
          deleteUser: vi.fn().mockResolvedValue({})
        }
      };
      clerk.clerkClient.mockResolvedValue(mockClerkClient);

      const req = createMockRequest({ method: 'DELETE' });
      const res = await DELETE(req, { params });

      expect(res.status).toBe(204);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockClerkClient.users.deleteUser).toHaveBeenCalledWith(mockClerkId);
    });

    it('returns 404 if user does not exist', async () => {
      // Auth succeeds, but target user is null
      mockAdminSession(clerk, prisma, {}, null); 
      // Force null for the ID-based lookup if the smart mock default is too broad
      prisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.clerkId) return Promise.resolve({ role: 'ADMIN' });
        return Promise.resolve(null);
      });

      const req = createMockRequest({ method: 'DELETE' });
      const res = await DELETE(req, { params });

      expect(res.status).toBe(404);
    });
  });
});
