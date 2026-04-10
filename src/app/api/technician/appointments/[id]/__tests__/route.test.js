import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH, POST } from '../route';
import prisma from '@/lib/prisma';
import * as clerk from '@clerk/nextjs/server';
import { createMockRequest, mockRestrictedSession, mockAdminSession } from '@/lib/__tests__/api-test-utils';

// Clerk mocked globally
vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
    appointment: { 
        findUnique: vi.fn(), 
        update: vi.fn() 
    },
  },
}));

describe('Technician Appointment API (/api/technician/appointments/[id])', () => {
  const appointmentId = 'apt_123';
  const params = Promise.resolve({ id: appointmentId });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PATCH (Status Update)', () => {
    it('returns 403 if technician is not assigned to the appointment', async () => {
      mockRestrictedSession(clerk, prisma, 'TECHNICIAN');
      
      prisma.appointment.findUnique.mockResolvedValue({
        id: appointmentId,
        technician: { userId: 'different_tech' }
      });

      const req = createMockRequest({ method: 'PATCH', body: { status: 'IN_PROGRESS' } });
      const res = await PATCH(req, { params });

      expect(res.status).toBe(403);
    });

    it('updates status if technician is assigned to the appointment', async () => {
      const mockTechUser = { id: 'u_tech_1', clerkId: 'clerk_tech_1', role: 'TECHNICIAN' };
      clerk.auth.mockResolvedValue({ userId: mockTechUser.clerkId });
      prisma.user.findUnique.mockResolvedValue(mockTechUser);
      
      prisma.appointment.findUnique.mockResolvedValue({
        id: appointmentId,
        technician: { userId: mockTechUser.id }
      });
      
      prisma.appointment.update.mockResolvedValue({ id: appointmentId, status: 'IN_PROGRESS' });

      const req = createMockRequest({ method: 'PATCH', body: { status: 'IN_PROGRESS' } });
      const res = await PATCH(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe('IN_PROGRESS');
      expect(prisma.appointment.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: appointmentId },
        data: { status: 'IN_PROGRESS' }
      }));
    });

    it('allows ADMIN to update any appointment status', async () => {
      mockAdminSession(clerk, prisma);
      
      prisma.appointment.findUnique.mockResolvedValue({
        id: appointmentId,
        technician: { userId: 'some_tech' }
      });
      prisma.appointment.update.mockResolvedValue({ id: appointmentId, status: 'COMPLETED' });

      const req = createMockRequest({ method: 'PATCH', body: { status: 'COMPLETED' } });
      const res = await PATCH(req, { params });

      expect(res.status).toBe(200);
    });
  });

  describe('POST (Notify)', () => {
    it('successfully mocks sending a notification', async () => {
      mockRestrictedSession(clerk, prisma, 'TECHNICIAN');
      
      const req = createMockRequest({ 
        method: 'POST', 
        body: { type: 'ARRIVAL_SOON', message: 'Il arrive!' } 
      });
      const res = await POST(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
