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
      const { sendPushNotification } = await import("@/lib/web-push");
      
      // 1. Notify CLIENT of any status change
      if (updatedAppointment.request?.userId) {
        let statusMsg = "";
        switch(status) {
          case 'EN_ROUTE': statusMsg = "Votre technicien est en route !"; break;
          case 'ON_SITE': statusMsg = "Le technicien est arrivé sur place."; break;
          case 'COMPLETED': statusMsg = "Votre réparation est terminée !"; break;
          case 'CANCELLED': statusMsg = "Votre intervention a été annulée."; break;
        }

        if (statusMsg) {
          await sendPushNotification(updatedAppointment.request.userId, {
            title: "Mise à jour de votre réparation",
            body: statusMsg,
            url: `/interventions/${updatedAppointment.request.id}`,
          });
        }
      }

      // 2. Notify ADMIN when COMPLETED or CANCELLED
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        for (const admin of admins) {
          await sendPushNotification(admin.id, {
            title: `Intervention ${status === 'COMPLETED' ? 'terminée' : 'annulée'}`,
            body: `L'intervention de ${updatedAppointment.technician.user.firstName} pour ${updatedAppointment.request.clientFirstName} est ${status.toLowerCase()}.`,
            url: `/admin/interventions/${updatedAppointment.id}`,
          });
        }
      }
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
