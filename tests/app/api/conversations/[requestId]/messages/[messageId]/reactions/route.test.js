import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/conversations/[requestId]/messages/[messageId]/reactions/route';
import prisma from '@/db/prisma';
import * as clerk from '@clerk/nextjs/server';
import { pusherServer } from '@/lib/pusher';
import { createMockRequest, mockRestrictedSession } from 'tests/lib/api-test-utils';

// Mocks
vi.mock('@/db/prisma', () => ({
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

describe('Message Reactions API (/api/conversations/[requestId]/messages/[messageId]/reactions)', () => {
  const requestId = 'req_123';
  const messageId = 'msg_123';
  const params = Promise.resolve({ requestId, messageId });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds a new reaction when none exists for the emoji', async () => {
    const mockClerkId = 'clerk_1';
    clerk.auth.mockResolvedValue({ userId: mockClerkId });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    
    // Message with no reactions
    prisma.message.findUnique.mockResolvedValue({ id: messageId, reactions: [] });
    
    prisma.message.update.mockResolvedValue({ id: messageId, reactions: [{ emoji: '👍', userIds: ['u1'] }] });

    const req = createMockRequest({ method: 'POST', body: { emoji: '👍' } });
    const res = await POST(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.message.update).toHaveBeenCalledWith({
      where: { id: messageId },
      data: {
        reactions: [{ emoji: '👍', userIds: ['u1'] }]
      }
    });
  });

  it('removes a reaction if user already reacted with the same emoji (toggle off)', async () => {
    clerk.auth.mockResolvedValue({ userId: 'clerk_1' });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    
    // Message with existing reaction from u1
    prisma.message.findUnique.mockResolvedValue({ 
        id: messageId, 
        reactions: [{ emoji: '❤️', userIds: ['u1', 'u2'] }] 
    });
    
    prisma.message.update.mockResolvedValue({ id: messageId, reactions: [{ emoji: '❤️', userIds: ['u2'] }] });

    const req = createMockRequest({ method: 'POST', body: { emoji: '❤️' } });
    const res = await POST(req, { params });

    expect(res.status).toBe(200);
    expect(prisma.message.update).toHaveBeenCalledWith({
      where: { id: messageId },
      data: {
        reactions: [{ emoji: '❤️', userIds: ['u2'] }]
      }
    });
  });

  it('adds user ID to existing emoji reaction from others', async () => {
    clerk.auth.mockResolvedValue({ userId: 'clerk_1' });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    
    // Message with reaction from u2 only
    prisma.message.findUnique.mockResolvedValue({ 
        id: messageId, 
        reactions: [{ emoji: '🔥', userIds: ['u2'] }] 
    });
    
    prisma.message.update.mockResolvedValue({ id: messageId, reactions: [{ emoji: '🔥', userIds: ['u2', 'u1'] }] });

    const req = createMockRequest({ method: 'POST', body: { emoji: '🔥' } });
    await POST(req, { params });

    expect(prisma.message.update).toHaveBeenCalledWith({
      where: { id: messageId },
      data: {
        reactions: expect.arrayContaining([{ emoji: '🔥', userIds: ['u2', 'u1'] }])
      }
    });
  });

  it('triggers message-updated Pusher event after reaction update', async () => {
    clerk.auth.mockResolvedValue({ userId: 'clerk_1' });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.message.findUnique.mockResolvedValue({ id: messageId, reactions: [] });
    
    const updatedMessage = { id: messageId, reactions: [{ emoji: '🚀', userIds: ['u1'] }] };
    prisma.message.update.mockResolvedValue(updatedMessage);

    const req = createMockRequest({ method: 'POST', body: { emoji: '🚀' } });
    await POST(req, { params });

    expect(pusherServer.trigger).toHaveBeenCalledWith(
        `presence-conversation-${requestId}`,
        'message-updated',
        updatedMessage
    );
  });
});
