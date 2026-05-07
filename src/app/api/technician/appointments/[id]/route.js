import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withTechnician } from "@/lib/admin";

/**
 * Update appointment status (from technician dashboard).
 */
export const PATCH = withTechnician(async (req, { params }, user) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    // Validate if appointment belongs to technician (unless admin)
    const intervention = await prisma.repairRequest.findUnique({
      where: { id },
    });

    if (!intervention) {
      return new NextResponse("Intervention not found", { status: 404 });
    }

    if (user.role !== "ADMIN" && intervention.technicianId !== user.id) {
      return new NextResponse("Unauthorized to update this intervention", {
        status: 403,
      });
    }

    const updatedIntervention = await prisma.repairRequest.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        technician: true
      },
    });

    // --- PUSH NOTIFICATION LOGIC ---
    try {
      const { notifyInterventionStatusUpdate } = await import("@/lib/web-push");
      await notifyInterventionStatusUpdate(id, status);
    } catch (pushError) {
      console.error("[PUSH_NOTIFICATION_TRIGGER_ERROR]", pushError);
    }
    // -------------------------------


    return NextResponse.json(updatedIntervention);
  } catch (error) {
    console.error("[TECH_APPOINTMENT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});


