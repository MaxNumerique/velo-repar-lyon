import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const services = await prisma.servicePackage.findMany({
      orderBy: { price: "asc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Public API Error - Services:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
