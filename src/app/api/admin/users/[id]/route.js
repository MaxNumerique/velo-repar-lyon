import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/db/prisma";
import { withAdmin } from "@/lib/auth";

export const PATCH = withAdmin(async (req, { params }) => {
  try {
    const { id } = params;
    const body = await req.json();
    const { role, isBlocked, email, firstName, lastName } = body;

    // 1. If email or names change, update Clerk
    if (email || firstName || lastName) {
      const client = await clerkClient();

      // We need the clerkId for this user
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { clerkId: true },
      });

      if (currentUser?.clerkId) {
        await client.users.updateUser(currentUser.clerkId, {
          ...(email ? { emailAddress: [email] } : {}),
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
        });
      }
    }

    // 2. Update Prisma
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined ? { role } : {}),
        ...(isBlocked !== undefined ? { isBlocked } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_ID_PATCH]", error);

    let message = "Une erreur est survenue lors de la mise à jour.";
    if (error.errors?.[0]?.code === "form_identifier_exists") {
      message = "Cet email est déjà utilisé par un autre compte.";
    }

    return NextResponse.json({ message }, { status: 400 });
  }
});

export const DELETE = withAdmin(async (req, { params }) => {
  const { id } = params;

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { clerkId: true },
  });

  if (!targetUser) {
    return new NextResponse("Not Found", { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.repairRequest.updateMany({
      where: { technicianId: id },
      data: { technicianId: null }
    });

    await tx.repairRequest.deleteMany({
      where: { userId: id },
    });

    await tx.bike.deleteMany({
      where: { userId: id },
    });

    await tx.user.delete({
      where: { id },
    });
  });

  try {
    const client = await clerkClient();
    await client.users.deleteUser(targetUser.clerkId);
    console.log(
      `[USER_DELETE] Successfully deleted from Clerk: ${targetUser.clerkId}`,
    );
  } catch (clerkError) {
    console.warn(
      `[USER_DELETE] Could not delete from Clerk (might already be gone):`,
      clerkError.message,
    );
  }

  return new NextResponse(null, { status: 204 });
});
