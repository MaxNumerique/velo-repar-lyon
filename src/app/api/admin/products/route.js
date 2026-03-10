import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/admin";

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  const where = {
    ...(category && category !== "ALL" ? { category } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
});

export const POST = withAdmin(async (req) => {
  const body = await req.json();
  const { name, description, price, category, image, isActive } = body;

  if (!name || price === undefined) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: parseFloat(price),
      category,
      image,
      isActive: isActive !== undefined ? isActive : true,
    },
  });

  return NextResponse.json(product);
});
