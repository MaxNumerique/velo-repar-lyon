import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function PATCH(req, { params }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { 
      status, 
      description, 
      scheduledAt, 
      technicianId,
      clientFirstName,
      clientLastName,
      clientPhone,
      bikeModel,
      bikeType,
      address
    } = body;

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.repairRequest.update({
        where: { id },
        data: {
          status,
          description,
          clientFirstName,
          clientLastName,
          clientPhone,
          bikeModel,
          bikeType,
          address
        }
      });

      if (scheduledAt || technicianId) {
        await tx.appointment.update({
          where: { requestId: id },
          data: {
            ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
            ...(technicianId ? { technicianId } : {}),
          }
        });
      }

      return request;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error - Admin Intervention PATCH:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const intervention = await prisma.repairRequest.findUnique({
      where: { id },
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
      }
    });

    if (!intervention) {
      return NextResponse.json({ error: 'Intervention not found' }, { status: 404 });
    }

    return NextResponse.json(intervention);
  } catch (error) {
    console.error("API Error - Admin Intervention GET:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await prisma.$transaction(async (tx) => {
      // Delete appointment first due to relation
      await tx.appointment.deleteMany({
        where: { requestId: id }
      });
      
      await tx.repairRequest.delete({
        where: { id }
      });
    });

    return NextResponse.json({ message: 'Intervention deleted' });
  } catch (error) {
    console.error("API Error - Admin Intervention DELETE:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
