import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/conversations/[requestId]/messages/route';
import prisma from '@/db/prisma';
import * as clerk from '@clerk/nextjs/server';
import { pusherServer } from '@/lib/pusher';
import { createMockRequest, mockRestrictedSession } from 'tests/lib/api-test-utils';

// Mocks
vi.mock('@/db/prisma', () => ({
  default: {
    message: { findMany: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    repairRequest: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/pusher', () => ({
  pusherServer: {
    trigger: vi.fn().mockResolvedValue({}),
  },
}));

describe('Conversation Messages API (/api/conversations/[requestId]/messages)', () => {
  const requestId = 'req_123';
  const params = Promise.resolve({ requestId });

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      clerkId: 'user_1',
      role: 'CLIENT',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe'
    });
  });


  describe('GET', () => {
    it('returns 401 if not authenticated', async () => {
      mockRestrictedSession(clerk, prisma, null);
      const req = createMockRequest();
      const res = await GET(req, { params });
      
      expect(res.status).toBe(401);
    });

    it('returns messages for a request', async () => {
      clerk.auth.mockResolvedValue({ userId: 'user_1' });
      const mockMessages = [{ id: 'm1', content: 'Hello' }];
      prisma.message.findMany.mockResolvedValue(mockMessages);

      const req = createMockRequest();
      const res = await GET(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(prisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { requestId }
      }));
    });
  });

  describe('POST', () => {
    it('creates a message and triggers Pusher', async () => {
      const mockClerkId = 'clerk_1';
      clerk.auth.mockResolvedValue({ userId: mockClerkId });
      
      const mockUser = { id: 'u1', clerkId: mockClerkId, role: 'CLIENT', firstName: 'Test' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      const mockRequest = { id: requestId, userId: 'u1', technicianId: 't1' };
      prisma.repairRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.user.findMany.mockResolvedValue([]); // For admins notification
      
      const mockMessage = { id: 'm1', content: 'New message' };
      prisma.message.create.mockResolvedValue(mockMessage);

      const req = createMockRequest({ 
        method: 'POST', 
        body: { content: 'New message' } 
      });
      const res = await POST(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBe('m1');
      expect(pusherServer.trigger).toHaveBeenCalledWith(
        `presence-conversation-${requestId}`,
        'new-message',
        mockMessage
      );
      expect(prisma.repairRequest.update).toHaveBeenCalled();
    });

    it('updates repair request timestamp', async () => {
        clerk.auth.mockResolvedValue({ userId: 'clerk_1' });
        prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
        prisma.repairRequest.findUnique.mockResolvedValue({ id: requestId });
  
        const req = createMockRequest({ method: 'POST', body: { content: 'First message' } });
        await POST(req, { params });
  
        expect(prisma.repairRequest.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: requestId }
        }));
      });
  });
});
