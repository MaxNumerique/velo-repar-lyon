import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { geocodeAddress } from "@/lib/googleMaps";
import { withAuth } from "@/lib/auth";

export const POST = withAuth(async (req, params, user) => {
  try {
    const {
      address,
      description,
      bikeType,
      bikeModel,
      servicePackageId,
      products = [],
      clientInfo,
      scheduledAt,
      technicianId,
      bikePhotos = [],
      issuePhotos = [],
    } = await req.json();
    if (scheduledAt && new Date(scheduledAt) < new Date()) {
      return NextResponse.json(
        { error: "La date d'intervention ne peut pas être dans le passé." },
        { status: 400 },
      );
    }
    const coords = await geocodeAddress(address);
    let updatedUser = user;
    if (clientInfo) {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: user.firstName || clientInfo.firstName,
          lastName: user.lastName || clientInfo.lastName,
          phone: user.phone || clientInfo.phone,
        },
      });
    }

    const request = await prisma.repairRequest.create({
      data: {
        address,
        description,
        lat: coords?.lat,
        lng: coords?.lng,
        bikeDetails: {
          brand: clientInfo?.bikeBrand || null,
          model: bikeModel || null,
          type: bikeType || null,
        },
        bikeImageUrl: clientInfo?.bikeImageUrl || null,
        bikeIndexId: clientInfo?.bikeIndexId || null,
        bikePhotos,
        issuePhotos,
        clientFirstName: clientInfo?.firstName,
        clientLastName: clientInfo?.lastName,
        clientPhone: clientInfo?.phone,
        clientEmail: user.email,
        userId: user.id,
        servicePackageId,
        products: {
          create: products.map((p) => ({
            productId: p.id,
            quantity: p.quantity,
            price: p.price,
          })),
        },
        ...(scheduledAt && technicianId
          ? {
              technicianId,
              scheduledAt: new Date(scheduledAt),
              status: "SCHEDULED",
            }
          : {}),
      },
      include: {
        products: true,
      },
    });

    try {
      const { sendPushNotification } = await import("@/lib/webPush");
      if (technicianId) {
        const tech = await prisma.user.findUnique({
          where: { id: technicianId, role: 'TECHNICIAN' },
        });
        if (tech) {
          await sendPushNotification(tech.id, {
            title: "Nouvelle intervention assignée !",
            body: `${request.clientFirstName} ${request.clientLastName} à ${address}`,
            url: `/interventions?id=${request.id}`,
          });
        }
      } else {
        const technicians = await prisma.user.findMany({
          where: { role: 'TECHNICIAN' }
        });
        for (const tech of technicians) {
          await sendPushNotification(tech.id, {
            title: "Nouvelle demande d'intervention !",
            body: `Une nouvelle demande à ${address} est disponible.`,
            url: "/interventions",
          });
        }
      }
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await sendPushNotification(admin.id, {
          title: "Nouvelle demande reçue",
          body: `Client: ${request.clientFirstName} ${request.clientLastName} - ${address}`,
          url: `/admin/interventions/${request.id}`,
        });
      }
    } catch (pushError) {
      console.error("[PUSH_NOTIFICATION_TRIGGER_ERROR]", pushError);
    }
    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("API Error - Repair Request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});
