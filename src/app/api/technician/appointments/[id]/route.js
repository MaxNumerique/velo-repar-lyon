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
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { technician: true },
    });

    if (!appointment) {
      return new NextResponse("Appointment not found", { status: 404 });
    }

    if (user.role !== "ADMIN" && appointment.technician.userId !== user.id) {
      return new NextResponse("Unauthorized to update this appointment", {
        status: 403,
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        request: {
          include: { user: true }
        },
        technician: {
          include: { user: true }
        }
      },
    });

    // --- PUSH NOTIFICATION LOGIC ---
    try {
      const { notifyInterventionStatusUpdate } = await import("@/lib/web-push");
      await notifyInterventionStatusUpdate(updatedAppointment.requestId, status);
    } catch (pushError) {
      console.error("[PUSH_NOTIFICATION_TRIGGER_ERROR]", pushError);
    }
    // -------------------------------


    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("[TECH_APPOINTMENT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});


