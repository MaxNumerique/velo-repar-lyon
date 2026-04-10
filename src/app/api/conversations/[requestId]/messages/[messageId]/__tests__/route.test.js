import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH, DELETE } from '../route';
import prisma from '@/lib/prisma';
import * as clerk from '@clerk/nextjs/server';
import { pusherServer } from '@/lib/pusher';
import { createMockRequest, mockRestrictedSession } from '@/lib/__tests__/api-test-utils';

// Mocks
vi.mock('@/lib/prisma', () => ({
  default: {
    message: { findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/pusher', () => ({
  pusherServer: {
    trigger: vi.fn().mockResolvedValue({}),
  },
}));

describe('Message Management API (/api/conversations/[requestId]/messages/[messageId])', () => {
  const requestId = 'req_123';
  const messageId = 'msg_123';
  const params = Promise.resolve({ requestId, messageId });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PATCH (Edit)', () => {
    it('updates message content if user is the sender', async () => {
      const mockClerkId = 'clerk_1';
      clerk.auth.mockResolvedValue({ userId: mockClerkId });
      
      const mockUser = { id: 'u1', clerkId: mockClerkId };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      const mockMessage = { id: messageId, senderId: 'u1', content: 'Original' };
      prisma.message.findUnique.mockResolvedValue(mockMessage);
      
      const updatedMessage = { ...mockMessage, content: 'Edited', isEdited: true };
      prisma.message.update.mockResolvedValue(updatedMessage);

      const req = createMockRequest({ 
        method: 'PATCH', 
        body: { content: 'Edited' } 
      });
      const res = await PATCH(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.content).toBe('Edited');
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: { content: 'Edited', isEdited: true }
      });
      expect(pusherServer.trigger).toHaveBeenCalledWith(
        `presence-conversation-${requestId}`,
        'message-updated',
        updatedMessage
      );
    });

    it('returns 403 if user is not the sender', async () => {
      clerk.auth.mockResolvedValue({ userId: 'clerk_1' });
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.message.findUnique.mockResolvedValue({ id: messageId, senderId: 'other_user' });

      const req = createMockRequest({ method: 'PATCH', body: { content: 'Hack' } });
      const res = await PATCH(req, { params });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE', () => {
    it('marks message as deleted if user is the sender', async () => {
      clerk.auth.mockResolvedValue({ userId: 'clerk_1' });
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.message.findUnique.mockResolvedValue({ id: messageId, senderId: 'u1' });
      
      prisma.message.update.mockResolvedValue({ id: messageId, isDeleted: true });

      const req = createMockRequest({ method: 'DELETE' });
      const res = await DELETE(req, { params });

      expect(res.status).toBe(200);
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: expect.objectContaining({
            isDeleted: true,
            content: "Ce message a été supprimé"
        })
      });
    });
  });
});
