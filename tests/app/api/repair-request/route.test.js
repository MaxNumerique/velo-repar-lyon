import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/repair-request/route';
import prisma from '@/db/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';
import { geocodeAddress } from '@/lib/googleMaps';
import { upsertUser } from '@/db/userSync';
import { createMockRequest } from 'tests/lib/api-test-utils';

// Mocks
vi.mock('@clerk/nextjs/server', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    auth: vi.fn(),
    currentUser: vi.fn(),
  };
});

vi.mock('@/lib/googleMaps', () => ({
  geocodeAddress: vi.fn(),
}));

vi.mock('@/db/userSync', () => ({
  upsertUser: vi.fn(),
}));

vi.mock('@/db/prisma', () => ({
  default: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    repairRequest: { create: vi.fn() },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

describe('Repair Request API (/api/repair-request)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    auth.mockResolvedValue({ userId: null });
    currentUser.mockResolvedValue(null);
    const req = createMockRequest({ method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 if scheduledAt is in the past', async () => {
    auth.mockResolvedValue({ userId: 'clerk_1' });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'CLIENT', email: 't@t.com' });
    currentUser.mockResolvedValue({ id: 'clerk_1' });
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    const req = createMockRequest({ 
      method: 'POST', 
      body: { scheduledAt: pastDate } 
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain('pas être dans le passé');
  });

  it('creates a repair request and syncs user if missing', async () => {
    auth.mockResolvedValue({ userId: 'clerk_1' });
    const mockClerkUser = { 
        id: 'clerk_1', 
        emailAddresses: [{ emailAddress: 'test@test.com' }] 
    };
    currentUser.mockResolvedValue(mockClerkUser);
    geocodeAddress.mockResolvedValue({ lat: 45.75, lng: 4.85 });
    prisma.user.findUnique.mockResolvedValue(null);
    upsertUser.mockResolvedValue({ id: 'u1', firstName: 'John' });
    prisma.user.update.mockResolvedValue({ id: 'u1' });
    const mockRequest = { id: 'r1', address: 'Lyon' };
    prisma.repairRequest.create.mockResolvedValue(mockRequest);
    const body = {
      address: 'Lyon',
      description: 'Broken wheel',
      bikeType: 'VILLE',
      servicePackageId: 'sp1',
      clientInfo: { firstName: 'John', lastName: 'Doe', phone: '0600000000' }
    };
    const req = createMockRequest({ method: 'POST', body });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(upsertUser).toHaveBeenCalledWith(mockClerkUser);
    expect(prisma.repairRequest.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            address: 'Lyon',
            userId: 'u1'
        })
    }));
  });

  it('creates request with appointment if scheduledAt and technicianId are provided', async () => {
    auth.mockResolvedValue({ userId: 'clerk_1' });
    currentUser.mockResolvedValue({ id: 'clerk_1', emailAddresses: [{ emailAddress: 't@t.com' }] });
    geocodeAddress.mockResolvedValue({ lat: 0, lng: 0 });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'CLIENT', email: 't@t.com' });
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const body = {
      address: 'Local',
      servicePackageId: 'sp1',
      scheduledAt: futureDate,
      technicianId: 'tech_1'
    };
    const req = createMockRequest({ method: 'POST', body });
    await POST(req);
    expect(prisma.repairRequest.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            scheduledAt: expect.any(Date),
            technicianId: 'tech_1',
            status: 'SCHEDULED'
        })
    }));
  });
});
