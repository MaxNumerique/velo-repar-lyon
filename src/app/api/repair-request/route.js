import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { geocodeAddress } from "@/lib/google-maps";
import { upsertUser } from "@/lib/user-sync";

export async function POST(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Validation: scheduledAt must be in the future
    if (scheduledAt && new Date(scheduledAt) < new Date()) {
      return NextResponse.json(
        { error: "La date d'intervention ne peut pas être dans le passé." },
        { status: 400 },
      );
    }

    // 1. Geocode the address
    const coords = await geocodeAddress(address);

    // 2. Sync User
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });
    if (!user) user = await upsertUser(clerkUser);
    if (!user)
      return NextResponse.json({ error: "User sync failed" }, { status: 500 });

    // 3. Update client details if provided and missing
    if (clientInfo) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: user.firstName || clientInfo.firstName,
          lastName: user.lastName || clientInfo.lastName,
          phone: user.phone || clientInfo.phone,
        },
      });
    }

    // 4. Create request
    const request = await prisma.repairRequest.create({
      data: {
        address,
        description,
        lat: coords?.lat,
        lng: coords?.lng,
        bikeBrand: clientInfo?.bikeBrand || null,
        bikeModel: bikeModel || null,
        bikeType: bikeType || null,
        bikeImageUrl: clientInfo?.bikeImageUrl || null,
        bikeIndexId: clientInfo?.bikeIndexId || null,
        bikePhotos,
        issuePhotos,
        clientFirstName: clientInfo?.firstName,
        clientLastName: clientInfo?.lastName,
        clientPhone: clientInfo?.phone,
        clientEmail: clerkUser.emailAddresses[0].emailAddress,
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
              appointment: {
                create: {
                  technicianId,
                  scheduledAt: new Date(scheduledAt),
                  status: "SCHEDULED",
                },
              },
            }
          : {}),
      },
      include: {
        products: true,
        appointment: true,
      },
    });

    // --- PUSH NOTIFICATION LOGIC ---
    try {
      const { sendPushNotification } = await import("@/lib/web-push");
      
      if (technicianId) {
        // Direct assignment
        const tech = await prisma.technicianProfile.findUnique({
          where: { id: technicianId },
          include: { user: true }
        });
        if (tech?.userId) {
          await sendPushNotification(tech.userId, {
            title: "Nouvelle intervention assignée !",
            body: `${request.clientFirstName} ${request.clientLastName} à ${address}`,
            url: `/technician/appointments/${request.appointment?.id}`,
          });
        }
      } else {
        // Broadcast to all technicians (simplified)
        const technicians = await prisma.technicianProfile.findMany({
          include: { user: true }
        });
        for (const tech of technicians) {
          if (tech.userId) {
            await sendPushNotification(tech.userId, {
              title: "Nouvelle demande d'intervention !",
              body: `Une nouvelle demande à ${address} est disponible.`,
              url: "/admin/interventions", // Or technician dashboard if applicable
            });
          }
        }
      }
      // Notify all admins
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
    // -------------------------------

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("API Error - Repair Request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
