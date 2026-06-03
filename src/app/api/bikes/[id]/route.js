import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/admin";

export const PATCH = withAuth(async (req, { params }, user) => {
  const { id } = params;
  const body = await req.json();
  const existingBike = await prisma.bike.findUnique({ where: { id } });

  if (!existingBike) {
    return new NextResponse("Bike not found", { status: 404 });
  }

  if (existingBike.userId !== user.id) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const bike = await prisma.bike.update({ where: { id }, data: body });
    return NextResponse.json(bike);
  } catch (error) {
    if (error.code === "P2002") {
      return new NextResponse("A bike with this serial number already exists", { status: 400 });
    }
    throw error;
  }
});

export const DELETE = withAuth(async (req, { params }, user) => {
  const { id } = params;
  const existingBike = await prisma.bike.findUnique({ where: { id } });

  if (!existingBike) {
    return new NextResponse("Bike not found", { status: 404 });
  }

  if (existingBike.userId !== user.id) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  await prisma.bike.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
});
