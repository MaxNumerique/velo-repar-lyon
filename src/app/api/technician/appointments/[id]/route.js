import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { withTechnician } from "@/lib/auth";

export const PATCH = withTechnician(async (req, { params }, user) => {
  const { id } = params;
  const { status } = await req.json();

  const intervention = await prisma.repairRequest.findUnique({ where: { id } });

  if (!intervention) {
    return new NextResponse("Intervention not found", { status: 404 });
  }

  if (user.role !== "ADMIN" && intervention.technicianId !== user.id) {
    return new NextResponse("Unauthorized to update this intervention", { status: 403 });
  }

  const updatedIntervention = await prisma.repairRequest.update({
    where: { id },
    data: { status },
    include: {
      user: true,
      technician: true,
    },
  });

  try {
    const { notifyInterventionStatusUpdate } = await import("@/lib/webPush");
    await notifyInterventionStatusUpdate(id, status);
  } catch (pushError) {
    console.error("[PUSH_NOTIFICATION_TRIGGER_ERROR]", pushError);
  }

  return NextResponse.json(updatedIntervention);
});
