import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../availability/route';
import prisma from '@/lib/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockRestrictedSession } from '@/lib/__tests__/api-test-utils';



vi.mock('@/lib/prisma', () => ({
  default: {
    repairRequest: { findMany: vi.fn() },
  },
}));

describe('Technician Availability API (/api/admin/technicians/availability)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    mockRestrictedSession(clerk, null, null);
    const req = createMockRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 if parameters are missing', async () => {
    clerk.auth.mockResolvedValue({ userId: 'user_123' });
    const req = createMockRequest({ url: 'http://localhost/api/admin/technicians/availability' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Missing parameters');
  });

  it('generates all slots when no appointments exist', async () => {
    clerk.auth.mockResolvedValue({ userId: 'user_123' });
    prisma.repairRequest.findMany.mockResolvedValue([]);

    const req = createMockRequest({ url: 'http://localhost/api/admin/technicians/availability?technicianId=tech_1&date=2024-05-20' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(11); // 8:30 to 18:30 inclusive = 11 slots
    expect(data[0]).toContain('08:30:00');
    expect(data[10]).toContain('18:30:00');
  });

  it('excludes booked slots', async () => {
    clerk.auth.mockResolvedValue({ userId: 'user_123' });
    
    // Mock an appointment at 10:30 UTC
    prisma.repairRequest.findMany.mockResolvedValue([
        { id: 'a1', scheduledAt: '2024-05-20T10:30:00.000Z', status: 'SCHEDULED' }
    ]);

    const req = createMockRequest({ url: 'http://localhost/api/admin/technicians/availability?technicianId=tech_1&date=2024-05-20' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(10); // 11 - 1 = 10 slots
    expect(data.some(slot => slot.includes('10:30:00'))).toBe(false);
  });
});
