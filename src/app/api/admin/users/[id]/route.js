import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/admin";

export const PATCH = withAdmin(async (req, { params }) => {
  try {
    const { id } = await params;
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
  try {
    const { id } = await params;

    // 1. Get the user's clerkId before deleting from Prisma
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { clerkId: true },
    });

    if (!targetUser) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 2. Clear related data in Prisma using a transaction
    await prisma.$transaction(async (tx) => {
      // Delete Technician related records
      const techProfile = await tx.technicianProfile.findUnique({
        where: { userId: id },
        select: { id: true },
      });

      if (techProfile) {
        // Delete appointments where this tech is assigned
        await tx.appointment.deleteMany({
          where: { technicianId: techProfile.id },
        });
        // Remove technician profile
        await tx.technicianProfile.delete({
          where: { id: techProfile.id },
        });
      }

      // Delete Admin profile
      await tx.adminProfile.deleteMany({
        where: { userId: id },
      });

      // Delete Repair Requests (and their appointments)
      const userRequests = await tx.repairRequest.findMany({
        where: { userId: id },
        select: { id: true },
      });

      for (const req of userRequests) {
        await tx.appointment.deleteMany({
          where: { requestId: req.id },
        });
      }

      await tx.repairRequest.deleteMany({
        where: { userId: id },
      });

      // Delete Bikes
      await tx.bike.deleteMany({
        where: { userId: id },
      });

      // Finally delete the User
      await tx.user.delete({
        where: { id },
      });
    });

    // 3. Try to delete from Clerk (Optional/Graceful)
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
  } catch (error) {
    console.error("[USER_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});
