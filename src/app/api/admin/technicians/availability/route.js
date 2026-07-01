import { NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (req, params, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const technicianId = searchParams.get('technicianId');
    const date = searchParams.get('date'); // YYYY-MM-DD
    if (!technicianId || !date) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const interventions = await prisma.repairRequest.findMany({
      where: {
        technicianId,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: { not: 'CANCELLED' }
      },
      orderBy: { scheduledAt: 'asc' }
    });
    const slots = [];
    for (let hour = 8; hour < 19; hour++) {
      const slotTime = new Date(date);
      slotTime.setUTCHours(hour, 30, 0, 0);
      const isBooked = interventions.some(intervention => {
        const interventionTime = new Date(intervention.scheduledAt);
        return interventionTime.getUTCHours() === hour && interventionTime.getUTCMinutes() === 30;
      });
      if (!isBooked) {
        slots.push(slotTime.toISOString());
      }
    }
    return NextResponse.json(slots);
  } catch (error) {
    console.error("API Error - Tech Availability GET:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
