import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from '../route';
import prisma from '@/lib/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockAdminSession, mockRestrictedSession } from '@/lib/__tests__/api-test-utils';



vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
    sector: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    technicianProfile: { upsert: vi.fn(), findMany: vi.fn() },
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}));

describe('Admin Sectors API (/api/admin/sectors)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns sectors with boundaries', async () => {
      mockAdminSession(clerk, prisma);
      
      const mockSectorsData = [{ id: 's1', name: 'Lyon Center', technicians: [] }];
      prisma.sector.findMany.mockResolvedValue(mockSectorsData);
      prisma.$queryRaw.mockResolvedValue([{ boundary: { type: 'Polygon', coordinates: [] } }]);

      const req = createMockRequest();
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data[0].id).toBe('s1');
      expect(data[0].boundary).toBeDefined();
    });
  });

  describe('POST', () => {
    const sectorPayload = {
      name: 'New Sector',
      geojson: { type: 'Polygon', coordinates: [] },
      color: '#ff0000',
      technicianIds: ['user_tech_1']
    };

    it('creates a new sector with spatial data', async () => {
      mockAdminSession(clerk, prisma);
      
      prisma.technicianProfile.upsert.mockResolvedValue({});
      prisma.technicianProfile.findMany.mockResolvedValue([{ id: 'tp_1' }]);
      prisma.$executeRaw.mockResolvedValue(1);

      const req = createMockRequest({ method: 'POST', body: sectorPayload });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBe('Sector created');
      expect(prisma.$executeRaw).toHaveBeenCalled(); // INSERT
      expect(prisma.sector.update).toHaveBeenCalled(); // Link tech
    });

    it('updates an existing sector and reassigns interventions if tech changes', async () => {
        mockAdminSession(clerk, prisma);
        const updatePayload = { ...sectorPayload, id: 'ext_s1' };
  
        prisma.sector.findUnique.mockResolvedValue({ 
          id: 'ext_s1', 
          technicians: [{ id: 'old_tp' }] 
        });
        prisma.technicianProfile.findMany.mockResolvedValue([{ id: 'new_tp' }]);
        prisma.$executeRaw.mockResolvedValue(1);
  
        const req = createMockRequest({ method: 'POST', body: updatePayload });
        const res = await POST(req);
  
        expect(res.status).toBe(200);
        expect(prisma.sector.update).toHaveBeenCalledWith({
            where: { id: 'ext_s1' },
            data: expect.objectContaining({ name: 'New Sector' })
        });
        // Check reassignment SQL call
        expect(prisma.$executeRaw).toHaveBeenCalled(); 
      });

    it('returns 400 if missing name or geojson', async () => {
      mockAdminSession(clerk, prisma);
      const req = createMockRequest({ method: 'POST', body: { name: 'Only Name' } });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE', () => {
    it('deletes a sector by ID', async () => {
      mockAdminSession(clerk, prisma);
      prisma.sector.delete.mockResolvedValue({});

      const req = createMockRequest({ url: 'http://localhost/api/admin/sectors?id=s1', method: 'DELETE' });
      const res = await DELETE(req);

      expect(res.status).toBe(200);
      expect(prisma.sector.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    });

    it('returns 400 if ID is missing', async () => {
        mockAdminSession(clerk, prisma);
        const req = createMockRequest({ url: 'http://localhost/api/admin/sectors', method: 'DELETE' });
        const res = await DELETE(req);
  
        expect(res.status).toBe(400);
    });
  });
});
