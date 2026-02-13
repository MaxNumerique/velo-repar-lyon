import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { geocodeAddress } from '@/lib/google-maps';

export async function GET(req) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const interventions = await prisma.repairRequest.findMany({
      where: {
        ...(status && status !== 'ALL' ? { status } : {}),
      },
      include: {
        user: true,
        bike: true,
        servicePackage: true,
        appointment: {
          include: {
            technician: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(interventions);
  } catch (error) {
    console.error("API Error - Admin Interventions GET:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      address, 
      description,
      clientFirstName,
      clientLastName,
      clientPhone,
      bikeModel,
      bikeType,
      servicePackageId,
      scheduledAt, // Expected ISO string
      technicianId // Optional manual assignment
    } = body;

    // 1. Geocode
    const coords = await geocodeAddress(address);
    if (!coords) {
      return NextResponse.json({ error: 'Could not geocode address' }, { status: 400 });
    }

    let selectedTechId = technicianId;

    // 2. Automatic assignment if not manual
    if (!selectedTechId) {
      const sectorTechs = await prisma.$queryRaw`
        SELECT t.id 
        FROM "TechnicianProfile" t
        JOIN "_TechnicianSectors" ts ON t.id = ts."B"
        JOIN "Sector" s ON ts."A" = s.id
        WHERE ST_Contains(s.boundary, ST_SetSRID(ST_Point(${coords.lng}, ${coords.lat}), 4326))
        LIMIT 1
      `;
      
      if (sectorTechs.length === 0) {
        return NextResponse.json({ error: 'No technician available in this sector' }, { status: 404 });
      }
      selectedTechId = sectorTechs[0].id;
    }

    // 3. Create Request and Appointment
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.repairRequest.create({
        data: {
          address,
          description,
          lat: coords.lat,
          lng: coords.lng,
          clientFirstName,
          clientLastName,
          clientPhone,
          bikeModel,
          bikeType,
          servicePackageId,
          status: 'PENDING'
        }
      });

      const appointment = await tx.appointment.create({
        data: {
          requestId: request.id,
          technicianId: selectedTechId,
          scheduledAt: new Date(scheduledAt),
          status: 'SCHEDULED'
        }
      });

      return { request, appointment };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("API Error - Admin Interventions POST:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
