import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { withAdmin } from "@/lib/auth";

export const POST = withAdmin(async (req) => {
  const body = await req.json();
  const { title, description, price, duration_min, image } = body;

  if (!title || !price || !duration_min) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const service = await prisma.servicePackage.create({
    data: {
      title,
      description,
      price: parseFloat(price),
      duration_min: parseInt(duration_min),
      image,
    },
  });

  return NextResponse.json(service);
});

export const GET = withAdmin(async () => {
  const services = await prisma.servicePackage.findMany({
    orderBy: { price: "asc" },
  });

  return NextResponse.json(services);
});
