import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as subscribePOST } from '@/app/api/push/subscribe/route';
import { POST as unsubscribePOST } from '@/app/api/push/unsubscribe/route';
import { POST as testPOST } from '@/app/api/push/test/route';
import prisma from '@/db/prisma';
import * as clerk from '@clerk/nextjs/server';
import { sendPushNotification } from '@/lib/webPush';

vi.mock('@clerk/nextjs/server', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    auth: vi.fn(),
    currentUser: vi.fn().mockResolvedValue(null),
  };
});

vi.mock('@/db/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
    pushSubscription: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/webPush', () => ({
  sendPushNotification: vi.fn(),
}));

describe('Push Notifications API (/api/push/*)', () => {
  const mockUser = { id: 'usr_1', clerkId: 'clerk_1', role: 'CLIENT' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/push/subscribe', () => {
    it('returns 401 if unauthenticated', async () => {
      clerk.auth.mockResolvedValue({ userId: null });
      const req = new Request('http://localhost/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint: 'https://example.com', keys: { p256dh: 'k', auth: 'a' } }),
      });
      const res = await subscribePOST(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid subscription payload', async () => {
      clerk.auth.mockResolvedValue({ userId: 'clerk_1' });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const req = new Request('http://localhost/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint: '' }),
      });
      const res = await subscribePOST(req);
      expect(res.status).toBe(400);
    });

    it('saves subscription for authenticated user', async () => {
      clerk.auth.mockResolvedValue({ userId: 'clerk_1' });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.pushSubscription.upsert.mockResolvedValue({});

      const req = new Request('http://localhost/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: 'https://push.example.com/sub/1',
          keys: { p256dh: 'p256key', auth: 'authkey' },
        }),
      });
      const res = await subscribePOST(req);
      expect(res.status).toBe(200);
      expect(prisma.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: 'https://push.example.com/sub/1' },
        update: { userId: 'usr_1', p256dh: 'p256key', auth: 'authkey' },
        create: { userId: 'usr_1', endpoint: 'https://push.example.com/sub/1', p256dh: 'p256key', auth: 'authkey' },
      });
    });
  });

  describe('POST /api/push/test', () => {
    it('returns 400 if sendPushNotification throws error', async () => {
      clerk.auth.mockResolvedValue({ userId: 'clerk_1' });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      sendPushNotification.mockRejectedValue(new Error('Aucun abonnement push actif pour cet utilisateur.'));

      const req = new Request('http://localhost/api/push/test', { method: 'POST' });
      const res = await testPOST(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe('Aucun abonnement push actif pour cet utilisateur.');
    });

    it('returns 200 on successful push test', async () => {
      clerk.auth.mockResolvedValue({ userId: 'clerk_1' });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      sendPushNotification.mockResolvedValue();

      const req = new Request('http://localhost/api/push/test', { method: 'POST' });
      const res = await testPOST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
