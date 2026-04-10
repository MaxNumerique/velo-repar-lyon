import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../assign-technician/route';
import prisma from '@/lib/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockAdminSession, mockRestrictedSession } from '@/lib/__tests__/api-test-utils';

vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
    technicianProfile: { findFirst: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

describe('Admin Assign Technician API (/api/admin/interventions/assign-technician)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid coordinates', async () => {
    mockAdminSession(clerk, prisma);
    const req = createMockRequest({ url: 'http://localhost/api/admin/interventions/assign-technician?lat=abc&lng=def' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid coordinates');
  });

  it('returns 404 if no sector is found at coordinates', async () => {
    mockAdminSession(clerk, prisma);
    prisma.$queryRaw.mockResolvedValue([]);

    const req = createMockRequest({ url: 'http://localhost/api/admin/interventions/assign-technician?lat=48.8&lng=2.3' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('No technician available in this sector');
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('returns 404 if no available technician is found in the sector', async () => {
    mockAdminSession(clerk, prisma);
    prisma.$queryRaw.mockResolvedValue([{ id: 'sector_1' }]);
    prisma.technicianProfile.findFirst.mockResolvedValue(null);

    const req = createMockRequest({ url: 'http://localhost/api/admin/interventions/assign-technician?lat=48.8&lng=2.3' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('No available technician in this sector');
  });

  it('returns technician info if found', async () => {
    mockAdminSession(clerk, prisma);
    prisma.$queryRaw.mockResolvedValue([{ id: 'sector_1' }]);
    prisma.technicianProfile.findFirst.mockResolvedValue({
        id: 'tech_1',
        user: { firstName: 'Jean', lastName: 'Tech' }
    });

    const req = createMockRequest({ url: 'http://localhost/api/admin/interventions/assign-technician?lat=48.8&lng=2.3' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe('tech_1');
    expect(data.name).toBe('Jean Tech');
  });
});
