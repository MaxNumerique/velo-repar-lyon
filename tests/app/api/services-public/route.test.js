import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/services-public/route';
import prisma from '@/db/prisma';
import { createMockRequest } from 'tests/lib/api-test-utils';

vi.mock('@/db/prisma', () => ({
  default: {
    servicePackage: { findMany: vi.fn() },
  },
}));

describe('Public Services API (/api/services-public)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all services ordered by price', async () => {
    const mockServices = [
      { id: 's1', name: 'Basic', price: 20 },
      { id: 's2', name: 'Full', price: 50 }
    ];
    prisma.servicePackage.findMany.mockResolvedValue(mockServices);

    const req = createMockRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(prisma.servicePackage.findMany).toHaveBeenCalledWith({
      orderBy: { price: 'asc' }
    });
  });

  it('returns 500 if DB query fails', async () => {
    prisma.servicePackage.findMany.mockRejectedValue(new Error('DB failure'));

    const req = createMockRequest();
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
