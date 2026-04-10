import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import prisma from '@/lib/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockAdminSession, mockRestrictedSession } from '@/lib/__tests__/api-test-utils';



vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
    servicePackage: { findMany: vi.fn(), create: vi.fn() },
  },
}));

describe('Admin Services API (/api/admin/services)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns all service packages for admins', async () => {
      mockAdminSession(clerk, prisma);
      const mockServices = [{ id: 's1', title: 'Basic' }, { id: 's2', title: 'Full' }];
      prisma.servicePackage.findMany.mockResolvedValue(mockServices);

      const req = createMockRequest();
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(prisma.servicePackage.findMany).toHaveBeenCalled();
    });
  });

  describe('POST', () => {
    const newService = {
      title: 'New Service',
      description: 'Desc',
      price: '50',
      duration_min: '60'
    };

    it('creates a new service package', async () => {
      mockAdminSession(clerk, prisma);
      prisma.servicePackage.create.mockResolvedValue({ id: 's-new', ...newService, price: 50, duration_min: 60 });

      const req = createMockRequest({ method: 'POST', body: newService });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(prisma.servicePackage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'New Service',
          price: 50,
          duration_min: 60
        })
      });
      expect(data.id).toBe('s-new');
    });

    it('returns 400 if missing fields', async () => {
      mockAdminSession(clerk, prisma);
      const req = createMockRequest({ method: 'POST', body: { title: 'Only Title' } });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });
});
