import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/admin/products/route';
import prisma from '@/db/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockAdminSession, mockRestrictedSession } from 'tests/lib/api-test-utils';



vi.mock('@/db/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Admin Products API (/api/admin/products)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 if not authenticated', async () => {
      mockRestrictedSession(clerk, prisma, null);
      const req = createMockRequest();
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns a list of products for admins', async () => {
      mockAdminSession(clerk, prisma);
      const mockProducts = [
        { id: 'p1', name: 'Product 1', category: 'TIRES' },
        { id: 'p2', name: 'Product 2', category: 'BRAKES' }
      ];
      prisma.product.findMany.mockResolvedValue(mockProducts);
      const req = createMockRequest();
      const res = await GET(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(prisma.product.findMany).toHaveBeenCalled();
    });

    it('filters by category and search', async () => {
      mockAdminSession(clerk, prisma);
      const req = createMockRequest({ url: 'http://localhost/api/admin/products?category=TIRES&search=chain' });
      await GET(req);
      expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          category: 'TIRES',
          OR: [
            { name: { contains: 'chain', mode: 'insensitive' } },
            { description: { contains: 'chain', mode: 'insensitive' } }
          ]
        })
      }));
    });
  });

  describe('POST', () => {
    const newProduct = {
      name: 'New Product',
      description: 'Desc',
      price: '29.99',
      category: 'ACCESSORIES',
      isActive: true
    };

    it('creates a new product', async () => {
      mockAdminSession(clerk, prisma);
      prisma.product.create.mockResolvedValue({ id: 'p-new', ...newProduct, price: 29.99 });
      const req = createMockRequest({ method: 'POST', body: newProduct });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Product',
          price: 29.99
        })
      });
      expect(data.id).toBe('p-new');
    });

    it('returns 400 if required fields are missing', async () => {
      mockAdminSession(clerk, prisma);
      const req = createMockRequest({ method: 'POST', body: { description: 'No name' } });
      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Missing required fields' });
    });
  });
});
