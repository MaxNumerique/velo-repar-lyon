import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '@/app/api/admin/services/[id]/route';
import prisma from '@/db/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockAdminSession } from 'tests/lib/api-test-utils';



vi.mock('@/db/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
    servicePackage: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

describe('Admin Service ID API (/api/admin/services/[id])', () => {
  const serviceId = 'serv_123';
  const params = Promise.resolve({ id: serviceId });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns the service package if found', async () => {
      mockAdminSession(clerk, prisma);
      const mockService = { id: serviceId, title: 'Test Service', price: 50 };
      prisma.servicePackage.findUnique.mockResolvedValue(mockService);
      const req = createMockRequest();
      const res = await GET(req, { params });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.id).toBe(serviceId);
      expect(prisma.servicePackage.findUnique).toHaveBeenCalledWith({ where: { id: serviceId } });
    });

    it('returns 404 if not found', async () => {
      mockAdminSession(clerk, prisma);
      prisma.servicePackage.findUnique.mockResolvedValue(null);
      const req = createMockRequest();
      const res = await GET(req, { params });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'Service not found' });
    });
  });

  describe('PATCH', () => {
    it('updates the service details', async () => {
      mockAdminSession(clerk, prisma);
      const updateData = { title: 'Updated Title', price: '65.00', duration_min: '90' };
      prisma.servicePackage.update.mockResolvedValue({ id: serviceId, title: 'Updated Title', price: 65, duration_min: 90 });
      const req = createMockRequest({ method: 'PATCH', body: updateData });
      const res = await PATCH(req, { params });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(prisma.servicePackage.update).toHaveBeenCalledWith({
        where: { id: serviceId },
        data: expect.objectContaining({
          title: 'Updated Title',
          price: 65,
          duration_min: 90
        })
      });
      expect(data.price).toBe(65);
    });
  });

  describe('DELETE', () => {
    it('deletes the service package', async () => {
      mockAdminSession(clerk, prisma);
      prisma.servicePackage.delete.mockResolvedValue({});
      const req = createMockRequest({ method: 'DELETE' });
      const res = await DELETE(req, { params });
      expect(res.status).toBe(204);
      expect(prisma.servicePackage.delete).toHaveBeenCalledWith({ where: { id: serviceId } });
    });
  });
});
