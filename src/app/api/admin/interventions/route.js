import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { geocodeAddress } from "@/lib/googleMaps";
import { withAdmin, withAuth } from "@/lib/auth";
import { findTechnicianByLocation } from "@/features/sectors/services/sectorAssignment";

export const GET = withAuth(async (req, params, user) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    // Auto-cleanup: Cancel unfinished interventions from previous days
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    await prisma.repairRequest.updateMany({
      where: {
        status: { in: ["SCHEDULED", "EN_ROUTE", "ON_SITE"] },
        scheduledAt: { lt: startOfToday }
      },
      data: { status: "CANCELLED" }
    });

    const interventions = await prisma.repairRequest.findMany({
      where: {
        ...(status && status !== "ALL" ? { status: status } : {}),
        // Filter by user role
        ...(user.role === "CLIENT"
          ? { userId: user.id }
          : user.role === "TECHNICIAN"
            ? { technicianId: user.id }
            : {}), // ADMIN sees everything
      },
      include: {
        user: true,
        servicePackage: true,
        technician: true,
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
    scheduledAt, 
    technicianId, 
    bikePhotos = [],
  } = body;

  // 1. Auto-linking logic
  let autoUserId = null;
  if (clientEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: clientEmail },
      select: { id: true }
    });
    if (existingUser) autoUserId = existingUser.id;
  }

  // 2. Geocode
  const coords = await geocodeAddress(address);
  if (!coords) {
    return NextResponse.json({ error: "Could not geocode address" }, { status: 400 });
  }

  let selectedTechId = technicianId;

  // 3. Automatic assignment
  if (!selectedTechId) {
    selectedTechId = await findTechnicianByLocation(coords.lat, coords.lng);
    if (!selectedTechId) {
      return NextResponse.json({ error: "Aucun technicien disponible" }, { status: 404 });
    }
  }

  // 4. Create Request (Appointment is now merged)
  const request = await prisma.repairRequest.create({
    data: {
      address,
      description: description || "",
      lat: coords.lat,
      lng: coords.lng,
      userId: autoUserId,
      clientFirstName,
      clientLastName,
      clientPhone,
      clientEmail,
      bikeDetails: {
        brand: bikeBrand,
        model: bikeModel,
        type: bikeType,
      },
      bikeImageUrl,
      bikeIndexId,
      servicePackageId,
      bikePhotos,
      technicianId: selectedTechId,
      scheduledAt: new Date(scheduledAt),
      status: "SCHEDULED",
    },
  });

  return NextResponse.json(request, { status: 201 });
});
