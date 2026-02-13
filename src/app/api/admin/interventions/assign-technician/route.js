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
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    // 1. Find the sector using PostGIS (Unavoidable raw SQL)
    const sectors = await prisma.$queryRaw`
      SELECT id FROM "Sector"
      WHERE ST_Contains(boundary, ST_SetSRID(ST_Point(${lng}, ${lat}), 4326))
      LIMIT 1
    `;

    if (sectors.length === 0) {
      return NextResponse.json({ error: 'No technician available in this sector' }, { status: 404 });
    }

    const sectorId = sectors[0].id;

    // 2. Use Prisma to find the technician and their user details
    const technician = await prisma.technicianProfile.findFirst({
      where: {
        isAvailable: true,
        sectors: {
          some: { id: sectorId }
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!technician) {
      return NextResponse.json({ error: 'No available technician in this sector' }, { status: 404 });
    }

    return NextResponse.json({
      id: technician.id,
      name: `${technician.user.firstName} ${technician.user.lastName}`.trim()
    });
  } catch (error) {
    console.error("API Error - Assign Technician GET:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
