import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
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

    // 1. Geocode the address
    const coords = await geocodeAddress(address);

    // 2. Ensure internal user exists (sync if necessary)
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!user) {
      user = await upsertUser(clerkUser);
    }

    if (!user) {
      return NextResponse.json(
        { error: "User synchronization failed" },
        { status: 500 },
      );
    }

    // 3. Update user info if missing
    if (clientInfo) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: user.firstName || clientInfo.firstName,
          lastName: user.lastName || clientInfo.lastName,
          phone: user.phone || clientInfo.phone,
        },
      });
    }

    // 4. Create repair request
    const createData = {
      address,
      description,
      lat: coords?.lat,
      lng: coords?.lng,
      bikeType,
      bikeModel: bikeModel || null,
      bikePhotos: bikePhotos || [],
      issuePhotos: issuePhotos || [],
      clientFirstName: clientInfo?.firstName,
      clientLastName: clientInfo?.lastName,
      clientPhone: clientInfo?.phone,
      status: scheduledAt ? "ASSIGNED" : "PENDING",
      user: { connect: { id: user.id } },
      ...(servicePackageId
        ? { servicePackage: { connect: { id: servicePackageId } } }
        : {}),
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
    };

    const request = await prisma.repairRequest.create({
      data: createData,
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
