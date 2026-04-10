import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/admin";

/**
 * List all bikes for the current user.
 */
export const GET = withAuth(async (req, params, user) => {
  try {
    const bikes = await prisma.bike.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bikes);
  } catch (error) {
    console.error("[BIKES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

/**
 * Add a new bike to the user's park.
 */
export const POST = withAuth(async (req, params, user) => {
  try {
    const body = await req.json();
    const { 
        brand, 
        modelName, 
        type, 
        photos = [], 
        imageUrl, 
        bikeIndexId, 
        notes 
    } = body;

    if (!brand) {
      return new NextResponse("Brand is required", { status: 400 });
    }

    const bike = await prisma.bike.create({
      data: {
        brand,
        modelName,
        type,
        photos,
        imageUrl,
        bikeIndexId,
        notes,
        userId: user.id,
      },
    });

    return NextResponse.json(bike, { status: 201 });
  } catch (error) {
    console.error("[BIKES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});
