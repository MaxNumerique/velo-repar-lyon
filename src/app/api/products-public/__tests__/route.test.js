import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import prisma from '@/lib/prisma';
import { createMockRequest } from '@/lib/__tests__/api-test-utils';

vi.mock('@/lib/prisma', () => ({
  default: {
    product: { findMany: vi.fn() },
  },
}));

describe('Public Products API (/api/products-public)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns active products ordered by name', async () => {
    const mockProducts = [
      { id: 'p1', name: 'Brake Pad', isActive: true },
      { id: 'p2', name: 'Chain', isActive: true }
    ];
    prisma.product.findMany.mockResolvedValue(mockProducts);

    const req = createMockRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  });

  it('returns 500 if DB query fails', async () => {
    prisma.product.findMany.mockRejectedValue(new Error('DB failure'));

    const req = createMockRequest();
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
