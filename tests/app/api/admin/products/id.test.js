import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '@/app/api/admin/products/[id]/route';
import prisma from '@/db/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockAdminSession, mockRestrictedSession } from 'tests/lib/api-test-utils';
import { NextResponse } from 'next/server';

vi.mock('@/db/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Admin Product ID API (/api/admin/products/[id])', () => {
  const productId = 'prod_123';
  const params = Promise.resolve({ id: productId });

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

    it('returns the product if found', async () => {
      mockAdminSession(clerk, prisma);
      const mockProduct = { id: productId, name: 'Test Product', price: 10 };
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const req = createMockRequest();
      const res = await GET(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBe(productId);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: productId } });
    });

    it('returns 404 if product not found', async () => {
      mockAdminSession(clerk, prisma);
      prisma.product.findUnique.mockResolvedValue(null);

      const req = createMockRequest();
      const res = await GET(req, { params });

      expect(res.status).toBe(404);
      expect(await res.text()).toBe('Not Found');
    });
  });

  describe('PATCH', () => {
    it('updates the product details', async () => {
      mockAdminSession(clerk, prisma);
      const updateData = { name: 'Updated Name', price: '15.50' };
      prisma.product.update.mockResolvedValue({ id: productId, name: 'Updated Name', price: 15.5 });

      const req = createMockRequest({ method: 'PATCH', body: updateData });
      const res = await PATCH(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: expect.objectContaining({
          name: 'Updated Name',
          price: 15.5
        })
      });
      expect(data.price).toBe(15.5);
    });
  });

  describe('DELETE', () => {
    it('deletes the product', async () => {
      mockAdminSession(clerk, prisma);
      prisma.product.delete.mockResolvedValue({});

      const req = createMockRequest({ method: 'DELETE' });
      const res = await DELETE(req, { params });

      expect(res.status).toBe(204);
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: productId } });
    });
  });
});
