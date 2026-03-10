import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Check Admin rights
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const service = await prisma.servicePackage.findUnique({
      where: { id },
    });

    if (!service) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("[SERVICE_ID_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Check Admin rights
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

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
  } catch (error) {
    console.error("[SERVICE_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Check Admin rights
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.servicePackage.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[SERVICE_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
