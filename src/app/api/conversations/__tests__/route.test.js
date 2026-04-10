import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import prisma from '@/lib/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockRestrictedSession, mockAdminSession } from '@/lib/__tests__/api-test-utils';

// Mocks
vi.mock('@clerk/nextjs/server', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    auth: vi.fn(),
  };
});

vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
    conversation: { findMany: vi.fn() },
  },
}));

describe('Conversations API (/api/conversations)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    mockRestrictedSession(clerk, prisma, null);
    const req = createMockRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 if user not found in DB', async () => {
    clerk.auth.mockResolvedValue({ userId: 'user_not_in_db' });
    prisma.user.findUnique.mockResolvedValue(null);
    const req = createMockRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('User not found'); 
  });

  it('returns conversations for a CLIENT', async () => {
    clerk.auth.mockResolvedValue({ userId: 'clerk_client_1' });
    const mockUser = { id: 'u1', clerkId: 'clerk_client_1', role: 'CLIENT' };
    prisma.user.findUnique.mockResolvedValue(mockUser);
    
    const mockConvs = [{ id: 'c1', requestId: 'r1' }];
    prisma.conversation.findMany.mockResolvedValue(mockConvs);

    const req = createMockRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(prisma.conversation.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { request: { userId: 'u1' } }
    }));
  });

  it('returns conversations for a TECHNICIAN', async () => {
    clerk.auth.mockResolvedValue({ userId: 'clerk_tech_1' });
    const mockUser = { 
        id: 'u2', 
        clerkId: 'clerk_tech_1', 
        role: 'TECHNICIAN', 
        technicianProfile: { id: 'tp_1' } 
    };
    prisma.user.findUnique.mockResolvedValue(mockUser);
    
    prisma.conversation.findMany.mockResolvedValue([{ id: 'c2' }]);

    const req = createMockRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.conversation.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { request: { appointment: { technicianId: 'tp_1' } } }
    }));
  });

  it('returns all conversations for an ADMIN', async () => {
    mockAdminSession(clerk, prisma);
    prisma.conversation.findMany.mockResolvedValue([{ id: 'all_1' }, { id: 'all_2' }]);

    const req = createMockRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
    // Admins have no specific filters in where clause in this route
    expect(prisma.conversation.findMany).toHaveBeenCalledWith(expect.objectContaining({
        include: expect.any(Object)
    }));
  });
});
