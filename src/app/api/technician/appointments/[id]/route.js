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
        request: true,
      },
    });

    // If appointment is set to ON_SITE or COMPLETED, we might want to update the request status too
    if (status === "ON_SITE") {
      await prisma.repairRequest.update({
        where: { id: updatedAppointment.requestId },
        data: { status: "IN_PROGRESS" },
      });
    } else if (status === "COMPLETED") {
      await prisma.repairRequest.update({
        where: { id: updatedAppointment.requestId },
        data: { status: "COMPLETED" },
      });
    }

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("[TECH_APPOINTMENT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

/**
 * Notify client (Mock/Placeholder for notification service).
 */
export const POST = withTechnician(async (req, { params }, user) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const { type, message } = body; // type: 'ARRIVAL_SOON', 'COMPLETED', etc.

    // In a real app, this would send an SMS or Email
    console.log(
      `[NOTIFICATION_MOCK] To client of appointment ${id}: ${type} - ${message}`,
    );

    return NextResponse.json({ success: true, sentAt: new Date() });
  } catch (error) {
    console.error("[TECH_NOTIFY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});
