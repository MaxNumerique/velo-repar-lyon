import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from '../me/route';
import prisma from '@/lib/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockRestrictedSession } from '@/lib/__tests__/api-test-utils';

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Admin Users Me API (/api/admin/users/me)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns the current user profile', async () => {
      const clerkId = 'user_me_123';
      clerk.auth.mockResolvedValue({ userId: clerkId });
      
      const mockUser = { id: 'u1', clerkId, firstName: 'Me' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const req = createMockRequest();
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { clerkId }
      }));
      expect(data.firstName).toBe('Me');
    });

    it('returns 401 if not authenticated', async () => {
        clerk.auth.mockResolvedValue({ userId: null });
        const res = await GET();
        expect(res.status).toBe(401);
    });
  });

  describe('PATCH', () => {
    it('updates own profile information', async () => {
      const clerkId = 'user_me_123';
      clerk.auth.mockResolvedValue({ userId: clerkId });
      
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', clerkId, role: 'CLIENT' });
      prisma.user.update.mockResolvedValue({ id: 'u1', firstName: 'Updated' });

      const req = createMockRequest({ method: 'PATCH', body: { firstName: 'Updated' } });
      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { clerkId },
        data: expect.objectContaining({ firstName: 'Updated' })
      }));
    });
  });
});
