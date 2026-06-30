import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/admin/users/route';
import prisma from '@/db/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockAdminSession, mockRestrictedSession } from 'tests/lib/api-test-utils';


vi.mock('@/db/prisma', () => ({
  default: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Admin Users API (/api/admin/users)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 if not authenticated', async () => {
      mockRestrictedSession(clerk, prisma, null);
      const req = createMockRequest();
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns 403 if not admin', async () => {
      mockRestrictedSession(clerk, prisma, 'TECHNICIAN');
      const req = createMockRequest();
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it('returns a list of users for admins', async () => {
      mockAdminSession(clerk, prisma);
      const mockUsers = [{ id: '1', email: 'u1@t.com' }, { id: '2', email: 'u2@t.com' }];
      prisma.user.findMany.mockResolvedValue(mockUsers);
      const req = createMockRequest();
      const res = await GET(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it('applies filters correctly', async () => {
        mockAdminSession(clerk, prisma);
        const req = createMockRequest({ url: 'http://localhost/api/admin/users?role=CLIENT&search=test' });
        await GET(req);
        expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                role: 'CLIENT',
                OR: expect.arrayContaining([
                    expect.objectContaining({ firstName: { contains: 'test', mode: 'insensitive' } })
                ])
            })
        }));
    });
  });

  describe('POST', () => {
    const newUser = {
      email: 'new@test.com',
      firstName: 'New',
      lastName: 'User',
      role: 'TECHNICIAN',
      password: 'password123'
    };

    it('creates a user in Clerk and then in Prisma', async () => {
      mockAdminSession(clerk, prisma);
      const mockClerkUser = { id: 'clerk_new_123' };
      const mockPrismaUser = { id: 'prisma_new_123', ...newUser };
      const mockClerkClient = {
        users: {
          createUser: vi.fn().mockResolvedValue(mockClerkUser)
        }
      };
      clerk.clerkClient.mockResolvedValue(mockClerkClient);
      prisma.user.create.mockResolvedValue(mockPrismaUser);
      const req = createMockRequest({ method: 'POST', body: newUser });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(mockClerkClient.users.createUser).toHaveBeenCalledWith(expect.objectContaining({
        emailAddress: [newUser.email],
        publicMetadata: { role: newUser.role }
      }));
      expect(prisma.user.create).toHaveBeenCalled();
      expect(data.id).toBe('prisma_new_123');
    });

    it('handles Clerk errors gracefully', async () => {
        mockAdminSession(clerk, prisma);
        const mockClerkClient = {
          users: {
            createUser: vi.fn().mockRejectedValue({
                errors: [{ code: 'form_identifier_exists' }]
            })
          }
        };
        clerk.clerkClient.mockResolvedValue(mockClerkClient);
        const req = createMockRequest({ method: 'POST', body: newUser });
        const res = await POST(req);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.message).toBe('Cet email est déjà utilisé.');
    });
  });
});
