import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '../[id]/route';
import prisma from '@/lib/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockAdminSession, mockRestrictedSession } from '@/lib/__tests__/api-test-utils';


vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
    repairRequest: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    interventionProduct: { deleteMany: vi.fn(), createMany: vi.fn() },
    product: { findMany: vi.fn() },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

describe('Admin Intervention ID API (/api/admin/interventions/[id])', () => {
  const interventionId = 'int_123';
  const params = Promise.resolve({ id: interventionId });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns the intervention details for admins', async () => {
      mockAdminSession(clerk, prisma);
      const mockInt = { id: interventionId, address: 'Test St' };
      prisma.repairRequest.findUnique.mockResolvedValue(mockInt);

      const req = createMockRequest();
      const res = await GET(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBe(interventionId);
    });

    it('returns 404 if not found', async () => {
        mockAdminSession(clerk, prisma);
        prisma.repairRequest.findUnique.mockResolvedValue(null);
  
        const req = createMockRequest();
        const res = await GET(req, { params });
        const data = await res.json();
  
        expect(res.status).toBe(404);
        expect(data.error).toBe('Intervention not found');
      });
  });

  describe('PATCH', () => {
    it('updates intervention and syncs products', async () => {
      mockAdminSession(clerk, prisma); // Admin is also a technician in logic
      
      const updateData = {
        status: 'EN_ROUTE',
        description: 'New desc',
        products: [{ productId: 'p1', quantity: 2 }]
      };

      prisma.repairRequest.update.mockResolvedValue({ id: interventionId, ...updateData });
      prisma.product.findMany.mockResolvedValue([{ id: 'p1', price: 10 }]);
      prisma.interventionProduct.deleteMany.mockResolvedValue({ count: 1 });
      prisma.interventionProduct.createMany.mockResolvedValue({ count: 1 });

      const req = createMockRequest({ method: 'PATCH', body: updateData });
      const res = await PATCH(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(prisma.repairRequest.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'EN_ROUTE' })
      }));
      expect(prisma.interventionProduct.createMany).toHaveBeenCalledWith({
        data: [{ requestId: interventionId, productId: 'p1', quantity: 2, price: 10 }]
      });
    });
  });

  describe('DELETE', () => {
    it('deletes intervention and appointment', async () => {
      mockAdminSession(clerk, prisma);
      prisma.repairRequest.delete.mockResolvedValue({});

      const req = createMockRequest({ method: 'DELETE' });
      const res = await DELETE(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBe('Intervention deleted');
      expect(prisma.repairRequest.delete).toHaveBeenCalledWith({
        where: { id: interventionId }
      });
    });
  });
});
