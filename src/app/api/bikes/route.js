import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/admin";

export const GET = withAuth(async (req, params, user) => {
  const bikes = await prisma.bike.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bikes);
});

export const POST = withAuth(async (req, params, user) => {
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
});
