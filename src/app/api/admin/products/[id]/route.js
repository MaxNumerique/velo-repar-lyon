import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { withAdmin } from "@/lib/auth";

export const GET = withAdmin(async (req, { params }) => {
  const { id } = params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.json(product);
});

export const PATCH = withAdmin(async (req, { params }) => {
  const { id } = params;

  const body = await req.json();
  const { name, description, price, category, image, isActive } = body;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(price !== undefined ? { price: parseFloat(price) } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(image !== undefined ? { image } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  return NextResponse.json(product);
});

export const DELETE = withAdmin(async (req, { params }) => {
  const { id } = params;

  await prisma.product.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
});
