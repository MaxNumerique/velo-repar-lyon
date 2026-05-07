import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import prisma from '@/lib/prisma';
import { geocodeAddress } from '@/lib/google-maps';
import { createMockRequest } from '@/lib/__tests__/api-test-utils';

// Mocks
vi.mock('@/lib/google-maps', () => ({
  geocodeAddress: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    $queryRaw: vi.fn(),
    user: { findMany: vi.fn() },
  },
}));

describe('Public Availability API (/api/availability)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 if address is missing', async () => {
    const req = createMockRequest({ url: 'http://localhost/api/availability' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Address is required');
  });

  it('returns 400 if address is invalid (geocoding fails)', async () => {
    geocodeAddress.mockResolvedValue(null);
    const req = createMockRequest({ url: 'http://localhost/api/availability?address=invalid' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid address');
  });

  it('returns 404 if address is not covered by any sector', async () => {
    geocodeAddress.mockResolvedValue({ lat: 45.75, lng: 4.85 });
    prisma.$queryRaw.mockResolvedValue([]); // No sector found

    const req = createMockRequest({ url: 'http://localhost/api/availability?address=Lyon' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toContain('pas encore votre secteur');
  });

  it('returns technicians and busy slots for a valid covered address', async () => {
    const coords = { lat: 45.75, lng: 4.85 };
    geocodeAddress.mockResolvedValue(coords);
    prisma.$queryRaw.mockResolvedValue([{ id: 'sector_1' }]);
    
    const mockTechs = [
      {
        id: 'u1',
        firstName: 'John',
        lastName: 'Doe',
        interventions: [{ scheduledAt: '2024-05-20T10:30:00Z' }]
      }
    ];
    prisma.user.findMany.mockResolvedValue(mockTechs);

    const req = createMockRequest({ url: 'http://localhost/api/availability?address=Lyon' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sectorId).toBe('sector_1');
    expect(data.technicians).toHaveLength(1);
    expect(data.technicians[0].name).toBe('John Doe');
    expect(data.technicians[0].busySlots).toContain('2024-05-20T10:30:00Z');
  });

  it('returns 404 if no technicians are assigned to the sector', async () => {
    geocodeAddress.mockResolvedValue({ lat: 45.75, lng: 4.85 });
    prisma.$queryRaw.mockResolvedValue([{ id: 'sector_1' }]);
    prisma.user.findMany.mockResolvedValue([]);

    const req = createMockRequest({ url: 'http://localhost/api/availability?address=Lyon' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toContain('Aucun technicien n\'est assigné');
  });
});
