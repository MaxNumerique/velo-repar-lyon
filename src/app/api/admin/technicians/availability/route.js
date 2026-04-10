import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Fetch existing appointments for that day
    const appointments = await prisma.appointment.findMany({
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

    // Simple slot generation: 08:30 to 18:30, every 1h
    const slots = [];
    for (let hour = 8; hour < 19; hour++) {
      const slotTime = new Date(date);
      slotTime.setUTCHours(hour, 30, 0, 0); // Use UTC for consistency
      
      const isBooked = appointments.some(appt => {
        const apptTime = new Date(appt.scheduledAt);
        return apptTime.getUTCHours() === hour && apptTime.getUTCMinutes() === 30;
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
}
