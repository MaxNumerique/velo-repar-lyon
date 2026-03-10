import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { geocodeAddress } from "@/lib/google-maps";
import { withAdmin, withTechnician } from "@/lib/admin";

export const GET = withTechnician(async (req, params, user) => {
  console.log(`[INTERVENTIONS_GET] User: ${user.id}, Role: ${user.role}`);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const interventions = await prisma.repairRequest.findMany({
      where: {
        ...(status && status !== "ALL" ? { status } : {}),
        // If not admin, filter by technician assigned to the request's appointment
        ...(user.role !== "ADMIN"
          ? {
              appointment: {
                technician: {
                  userId: user.id,
                },
              },
            }
          : {}),
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

    console.log(
      `[INTERVENTIONS_GET] Success: found ${interventions.length} records`,
    );
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
    bikeModel,
    bikeType,
    servicePackageId,
    scheduledAt, // Expected ISO string
    technicianId, // Optional manual assignment
    images, // Array of Cloudinary URLs
  } = body;

  // 1. Geocode
  const coords = await geocodeAddress(address);
  if (!coords) {
    return NextResponse.json(
      { error: "Could not geocode address" },
      { status: 400 },
    );
  }

  let selectedTechId = technicianId;

  // 2. Automatic assignment if not manual
  if (!selectedTechId) {
    const sectors = await prisma.$queryRaw`
      SELECT id FROM "Sector"
      WHERE ST_Contains(boundary, ST_SetSRID(ST_Point(${coords.lng}, ${coords.lat}), 4326))
      LIMIT 1
    `;

    if (sectors.length === 0) {
      return NextResponse.json(
        { error: "No technician available in this sector" },
        { status: 404 },
      );
    }

    const technician = await prisma.technicianProfile.findFirst({
      where: {
        isAvailable: true,
        sectors: {
          some: { id: sectors[0].id },
        },
      },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "No available technician in this sector" },
        { status: 404 },
      );
    }

    selectedTechId = technician.id;
  }

  // 3. Create Request and Appointment
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.repairRequest.create({
      data: {
        address,
        description: description || "",
        lat: coords.lat,
        lng: coords.lng,
        clientFirstName,
        clientLastName,
        clientPhone,
        bikeModel,
        bikeType,
        servicePackage: servicePackageId
          ? { connect: { id: servicePackageId } }
          : undefined,
        photos: images || [],
        status: "PENDING",
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
