import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/admin/interventions/route';
import prisma from '@/db/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockAdminSession } from 'tests/lib/api-test-utils';
import { geocodeAddress } from '@/lib/googleMaps';
import { findTechnicianByLocation } from '@/features/sectors/services/sectorAssignment';



vi.mock('@/db/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
    repairRequest: { findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

vi.mock('@/lib/googleMaps', () => ({
  geocodeAddress: vi.fn(),
}));

vi.mock('@/features/sectors/services/sectorAssignment', () => ({
  findTechnicianByLocation: vi.fn(),
}));


describe('Admin Interventions API (/api/admin/interventions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('auto-cancels expired interventions and returns the list', async () => {
      mockAdminSession(clerk, prisma);
      prisma.repairRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.repairRequest.findMany.mockResolvedValue([{ id: 'r1', address: 'Test' }]);
      const req = createMockRequest();
      const res = await GET(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(prisma.repairRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
            status: { in: ["SCHEDULED", "EN_ROUTE", "ON_SITE"] }
        }),
        data: { status: 'CANCELLED' }
      }));
      expect(data).toHaveLength(1);
    });

    it('filters by status if provided', async () => {
      mockAdminSession(clerk, prisma);
      prisma.repairRequest.findMany.mockResolvedValue([]);
      const req = createMockRequest({ url: 'http://localhost/api/admin/interventions?status=COMPLETED' });
      await GET(req);
      expect(prisma.repairRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          status: 'COMPLETED'
        })
      }));
    });
  });

  describe('POST', () => {
    const interventionData = {
      address: '10 Rue de la Paix, Paris',
      description: 'Crevaison',
      clientFirstName: 'Jean',
      clientLastName: 'Dupont',
      clientPhone: '0600000000',
      clientEmail: 'jean@dupont.com',
      bikeBrand: 'Trek',
      bikeModel: 'Domane',
      bikeType: 'ROAD',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    };

    it('creates an intervention with automatic assignment', async () => {
      mockAdminSession(clerk, prisma);
      geocodeAddress.mockResolvedValue({ lat: 48.8566, lng: 2.3522 });
      findTechnicianByLocation.mockResolvedValue('tech_123');
      prisma.repairRequest.create.mockResolvedValue({ id: 'r_new', ...interventionData });
      const req = createMockRequest({ method: 'POST', body: interventionData });
      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(geocodeAddress).toHaveBeenCalledWith(interventionData.address);
      expect(findTechnicianByLocation).toHaveBeenCalledWith(48.8566, 2.3522);
      expect(prisma.repairRequest.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ 
            technicianId: 'tech_123',
            status: 'SCHEDULED'
        })
      }));
    });

    it('returns 400 if geocoding fails', async () => {
      mockAdminSession(clerk, prisma);
      geocodeAddress.mockResolvedValue(null);
      const req = createMockRequest({ method: 'POST', body: interventionData });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe('Could not geocode address');
    });

    it('returns 404 if no technician is available', async () => {
        mockAdminSession(clerk, prisma);
        geocodeAddress.mockResolvedValue({ lat: 0, lng: 0 });
        findTechnicianByLocation.mockResolvedValue(null);
        const req = createMockRequest({ method: 'POST', body: interventionData });
        const res = await POST(req);
        const data = await res.json();
        expect(res.status).toBe(404);
        expect(data.error).toBe('Aucun technicien disponible');
      });
  });
});
