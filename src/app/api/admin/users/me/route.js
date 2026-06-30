import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { withAuth } from "@/lib/auth";

export const GET = withAuth(async (req, params, user) => {
  try {
    const userWithRequests = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        requests: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { address: true },
        },
      },
    });
    return NextResponse.json(userWithRequests);
  } catch (error) {
    console.error("[USER_ME_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

export const PATCH = withAuth(async (req, params, user) => {
  try {
    const body = await req.json();
    const { firstName, lastName, phone, isAvailable, avatar } = body;
    const updatedUser = await prisma.user.update({
      where: { clerkId: user.clerkId },
      data: {
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(avatar !== undefined ? { avatar } : {}),
        ...(isAvailable !== undefined ? { isAvailable } : {}),
      },
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USER_ME_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

