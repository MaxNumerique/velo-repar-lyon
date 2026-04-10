import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import prisma from '@/lib/prisma';
import * as clerk from '@clerk/nextjs/server';
import { pusherServer } from '@/lib/pusher';
import { createMockRequest, mockRestrictedSession } from '@/lib/__tests__/api-test-utils';

// Mocks
vi.mock('@/lib/prisma', () => ({
  default: {
    message: { findMany: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
    conversation: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
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
        where: { conversation: { requestId } }
      }));
    });
  });

  describe('POST', () => {
    it('creates a message and triggers Pusher', async () => {
      const mockClerkId = 'clerk_1';
      clerk.auth.mockResolvedValue({ userId: mockClerkId });
      
      const mockUser = { id: 'u1', clerkId: mockClerkId, role: 'CLIENT' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      const mockConv = { id: 'c1', requestId };
      prisma.conversation.findUnique.mockResolvedValue(mockConv);
      
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
      expect(prisma.conversation.update).toHaveBeenCalled();
    });

    it('creates conversation if it does not exist', async () => {
        clerk.auth.mockResolvedValue({ userId: 'clerk_1' });
        prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
        prisma.conversation.findUnique.mockResolvedValue(null);
        prisma.conversation.create.mockResolvedValue({ id: 'c_new', requestId });
  
        const req = createMockRequest({ method: 'POST', body: { content: 'First message' } });
        await POST(req, { params });
  
        expect(prisma.conversation.create).toHaveBeenCalledWith({
            data: { requestId }
        });
      });
  });
});
