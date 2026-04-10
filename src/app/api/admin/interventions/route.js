import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { geocodeAddress } from "@/lib/google-maps";
import { withAdmin, withAuth } from "@/lib/admin";
import { findTechnicianByLocation } from "@/lib/assignment-utils";

export const GET = withAuth(async (req, params, user) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    // Auto-cancel expired interventions (SCHEDULED appointments in the past)
    const now = new Date();
    const expiredAppts = await prisma.appointment.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lt: now }
      },
      select: { id: true, requestId: true }
    });

    if (expiredAppts.length > 0) {
      await prisma.appointment.updateMany({
        where: { id: { in: expiredAppts.map(a => a.id) } },
        data: { status: "CANCELLED" }
      });
    }

    const interventions = await prisma.repairRequest.findMany({
      where: {
        ...(status && status !== "ALL"
          ? { appointment: { status: status } }
          : {}),
        // Filter by user role
        ...(user.role === "CLIENT"
          ? { userId: user.id }
          : user.role === "TECHNICIAN"
            ? {
                appointment: {
                  technician: {
                    userId: user.id,
                  },
                },
              }
            : {}), // ADMIN sees everything
      },
      include: {
        user: true,
        bike: true,
        servicePackage: true,
        appointment: {
          include: {
            technician: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(interventions);
  } catch (error) {
    console.error("[INTERVENTIONS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

export const POST = withAdmin(async (req) => {
  const body = await req.json();
  const {
    address,
    description,
    clientFirstName,
    clientLastName,
    clientPhone,
    clientEmail,
    bikeBrand,
    bikeModel,
    bikeType,
    bikeImageUrl,
    bikeIndexId,
    servicePackageId,
    scheduledAt, // Expected ISO string
    technicianId, // Optional manual assignment
    images, // Array of Cloudinary URLs
  } = body;

  // 1. Auto-linking logic: If clientEmail is provided, check if a User exists
  let autoUserId = null;
  if (clientEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: clientEmail },
      select: { id: true }
    });
    if (existingUser) {
      autoUserId = existingUser.id;
    }
  }

  // 2. Geocode
  const coords = await geocodeAddress(address);
  if (!coords) {
    return NextResponse.json(
      { error: "Could not geocode address" },
      { status: 400 },
    );
  }

  let selectedTechId = technicianId;

  // 3. Automatic assignment
  if (!selectedTechId) {
    selectedTechId = await findTechnicianByLocation(coords.lat, coords.lng);

    if (!selectedTechId) {
      return NextResponse.json(
        { error: "Aucun technicien disponible dans ce secteur" },
        { status: 404 },
      );
    }
  }

  // 4. Create Request and Appointment
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.repairRequest.create({
      data: {
        address,
        description: description || "",
        lat: coords.lat,
        lng: coords.lng,
        user: autoUserId ? { connect: { id: autoUserId } } : undefined,
        clientFirstName,
        clientLastName,
        clientPhone,
        clientEmail,
        bikeBrand,
        bikeModel,
        bikeType,
        bikeImageUrl,
        bikeIndexId,
        servicePackage: servicePackageId
          ? { connect: { id: servicePackageId } }
          : undefined,
        photos: images || [],
      },
    });

    const appointment = await tx.appointment.create({
      data: {
        requestId: request.id,
        technicianId: selectedTechId,
        scheduledAt: new Date(scheduledAt),
        status: "SCHEDULED",
      },
    });

    return { request, appointment };
  });

  return NextResponse.json(result, { status: 201 });
});
