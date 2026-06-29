import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '@/app/api/interventions/[id]/route';
import prisma from '@/db/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockRestrictedSession, mockAdminSession } from 'tests/lib/api-test-utils';
import { canModifyIntervention } from '@/lib/dateUtils';
import { geocodeAddress } from '@/lib/googleMaps';

// Mocks (Clerk mocked globally)
vi.mock('@/db/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
    repairRequest: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

vi.mock('@/lib/dateUtils', () => ({
  canModifyIntervention: vi.fn(),
}));

vi.mock('@/lib/googleMaps', () => ({
  geocodeAddress: vi.fn(),
}));

describe('Public/Client Intervention ID API (/api/interventions/[id])', () => {
  const interventionId = 'int_123';
  const params = Promise.resolve({ id: interventionId });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns the intervention to the owner', async () => {
      mockRestrictedSession(clerk, prisma, 'CLIENT');
      // mockRestrictedSession sets user.id to 'user-456'
      prisma.repairRequest.findUnique.mockResolvedValue({ 
        id: interventionId, 
        userId: 'user-456', 
        description: 'Broken chain' 
      });

      const req = createMockRequest();
      const res = await GET(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.description).toBe('Broken chain');
    });

    it('returns 403 if user is not the owner', async () => {
      mockRestrictedSession(clerk, prisma, 'CLIENT');
      prisma.repairRequest.findUnique.mockResolvedValue({ 
        id: interventionId, 
        userId: 'other_user' 
      });

      const req = createMockRequest();
      const res = await GET(req, { params });

      expect(res.status).toBe(403);
    });

    it('allows ADMIN to see any intervention', async () => {
      mockAdminSession(clerk, prisma);
      prisma.repairRequest.findUnique.mockResolvedValue({ 
        id: interventionId, 
        userId: 'some_client' 
      });

      const req = createMockRequest();
      const res = await GET(req, { params });

      expect(res.status).toBe(200);
    });
  });

  describe('PATCH', () => {
    it('updates intervention if within 6h policy', async () => {
      mockRestrictedSession(clerk, prisma, 'CLIENT');
      prisma.repairRequest.findUnique.mockResolvedValue({ 
        id: interventionId, 
        userId: 'user-456',
        scheduledAt: new Date(Date.now() + 10 * 3600000) // 10h from now
      });
      canModifyIntervention.mockReturnValue(true);
      prisma.repairRequest.update.mockResolvedValue({ id: interventionId, description: 'Updated' });

      const req = createMockRequest({ method: 'PATCH', body: { description: 'Updated' } });
      const res = await PATCH(req, { params });

      expect(res.status).toBe(200);
      expect(prisma.repairRequest.update).toHaveBeenCalled();
    });

    it('returns 400 if less than 6h before intervention', async () => {
      mockRestrictedSession(clerk, prisma, 'CLIENT');
      prisma.repairRequest.findUnique.mockResolvedValue({ 
        id: interventionId, 
        userId: 'user-456',
        scheduledAt: new Date(Date.now() + 2 * 3600000) // 2h from now
      });
      canModifyIntervention.mockReturnValue(false);

      const req = createMockRequest({ method: 'PATCH', body: { description: 'Late Change' } });
      const res = await PATCH(req, { params });

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Modification impossible');
    });
  });

  describe('DELETE (Cancel)', () => {
    it('cancels intervention by updating appointment status', async () => {
        mockRestrictedSession(clerk, prisma, 'CLIENT');
        prisma.repairRequest.findUnique.mockResolvedValue({ 
          id: interventionId, 
          userId: 'user-456' 
        });
        canModifyIntervention.mockReturnValue(true);
  
        const req = createMockRequest({ method: 'DELETE' });
        const res = await DELETE(req, { params });
  
        expect(res.status).toBe(200);
        expect(prisma.repairRequest.update).toHaveBeenCalledWith(expect.objectContaining({
            data: { status: 'CANCELLED' }
        }));
      });
  });
});
