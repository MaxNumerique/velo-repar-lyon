import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { geocodeAddress } from '@/lib/google-maps';

export async function POST(req) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { address, description } = await req.json();

    // 1. Geocode the address
    const coords = await geocodeAddress(address);

    // 2. Find internal user
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Create repair request
    const request = await prisma.repairRequest.create({
      data: {
        address,
        description,
        lat: coords?.lat,
        lng: coords?.lng,
        userId: user.id,
      }
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("API Error - Repair Request:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
