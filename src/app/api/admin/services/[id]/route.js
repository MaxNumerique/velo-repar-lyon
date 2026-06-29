import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { withAdmin } from "@/lib/auth";

export const GET = withAdmin(async (req, { params }) => {
  const { id } = params;
  const service = await prisma.servicePackage.findUnique({
    where: { id },
  });
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
  return NextResponse.json(service);
});

export const PATCH = withAdmin(async (req, { params }) => {
  const { id } = params;
  const body = await req.json();
  const { title, description, price, duration_min, image } = body;
  const service = await prisma.servicePackage.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(price !== undefined ? { price: parseFloat(price) } : {}),
      ...(duration_min !== undefined
        ? { duration_min: parseInt(duration_min) }
        : {}),
      ...(image !== undefined ? { image } : {}),
    },
  });
  return NextResponse.json(service);
});

export const DELETE = withAdmin(async (req, { params }) => {
  const { id } = params;
  await prisma.servicePackage.delete({
    where: { id },
  });
  return new NextResponse(null, { status: 204 });
});
