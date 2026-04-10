import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/admin";

/**
 * Update a specific bike.
 */
export const PATCH = withAuth(async (req, { params }, user) => {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Check ownership
    const existingBike = await prisma.bike.findUnique({
      where: { id },
    });

    if (!existingBike) {
      return new NextResponse("Bike not found", { status: 404 });
    }

    if (existingBike.userId !== user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const bike = await prisma.bike.update({
      where: { id },
      data: body, // Caution: in production, you might want to whitelist fields
    });

    return NextResponse.json(bike);
  } catch (error) {
    console.error("[BIKE_PATCH]", error);
    if (error.code === 'P2002') {
        return new NextResponse("A bike with this serial number already exists", { status: 400 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
});

/**
 * Delete a specific bike.
 */
export const DELETE = withAuth(async (req, { params }, user) => {
  try {
    const { id } = await params;

    // Check ownership
    const existingBike = await prisma.bike.findUnique({
      where: { id },
    });

    if (!existingBike) {
      return new NextResponse("Bike not found", { status: 404 });
    }

    if (existingBike.userId !== user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await prisma.bike.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[BIKE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});
