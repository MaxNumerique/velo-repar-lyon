import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/pusher/auth/route';
import prisma from '@/db/prisma';
import * as clerk from '@clerk/nextjs/server';
import { pusherServer } from '@/lib/pusher';
import { createMockRequest } from 'tests/lib/api-test-utils';

// Mocks
vi.mock('@clerk/nextjs/server', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    auth: vi.fn(),
  };
});

vi.mock('@/db/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/pusher', () => ({
  pusherServer: {
    authorizeChannel: vi.fn(),
  },
}));

describe('Pusher Auth API (/api/pusher/auth)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    clerk.auth.mockResolvedValue({ userId: null });
    const req = createMockRequest({ method: 'POST' });
    const res = await POST(req);
    
    expect(res.status).toBe(401);
  });

  it('returns 404 if user not found', async () => {
    clerk.auth.mockResolvedValue({ userId: 'clerk_1' });
    prisma.user.findUnique.mockResolvedValue(null);
    
    const req = createMockRequest({ method: 'POST' });
    const res = await POST(req);
    
    expect(res.status).toBe(404);
  });

  it('authorizes channel for valid user', async () => {
    clerk.auth.mockResolvedValue({ userId: 'clerk_1' });
    const mockUser = { id: 'u1', firstName: 'John', lastName: 'Doe', role: 'CLIENT' };
    prisma.user.findUnique.mockResolvedValue(mockUser);
    
    pusherServer.authorizeChannel.mockReturnValue({ auth: 'token' });

    // FormData mock
    const formData = new FormData();
    formData.append('socket_id', 'socket_1');
    formData.append('channel_name', 'presence-chat');

    const req = new Request('http://localhost/api/pusher/auth', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.auth).toBe('token');
    expect(pusherServer.authorizeChannel).toHaveBeenCalledWith(
      'socket_1',
      'presence-chat',
      expect.objectContaining({
        user_id: 'u1',
        user_info: expect.objectContaining({ role: 'CLIENT' })
      })
    );
  });
});
