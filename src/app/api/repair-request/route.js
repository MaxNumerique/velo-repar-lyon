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
        bikeType,
        bikeModel: bikeModel || null,
        bikePhotos,
        issuePhotos,
        clientFirstName: clientInfo?.firstName,
        clientLastName: clientInfo?.lastName,
        clientPhone: clientInfo?.phone,
        status: scheduledAt ? "ASSIGNED" : "PENDING",
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

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("API Error - Repair Request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
