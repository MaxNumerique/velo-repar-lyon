import prisma from "@/lib/prisma";
import { geocodeAddress } from "@/lib/google-maps";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  try {
    const coords = await geocodeAddress(address);
    if (!coords)
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });

    // Find sector using SQL (PostGIS)
    const sectors = await prisma.$queryRaw`
      SELECT id FROM "Sector" 
      WHERE ST_Contains(boundary, ST_SetSRID(ST_Point(${coords.lng}, ${coords.lat}), 4326))
    `;

    if (sectors.length === 0) {
      return NextResponse.json(
        {
          error: "Désolé, nous ne couvrons pas encore votre secteur.",
          coords,
        },
        { status: 404 },
      );
    }

    const sectorId = sectors[0].id;

    // Get technicians for this sector
    const techs = await prisma.technicianProfile.findMany({
      where: {
        sectors: {
          some: { id: sectorId },
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointments: {
          where: {
            scheduledAt: {
              gte: new Date(),
            },
            status: {
              not: "CANCELLED",
            },
          },
        },
      },
    });

    if (techs.length === 0) {
      return NextResponse.json(
        {
          error:
            "Aucun technicien n'est assigné à votre secteur pour le moment.",
        },
        { status: 404 },
      );
    }

    // Return technicians and their busy slots
    return NextResponse.json({
      sectorId,
      coords,
      technicians: techs.map((t) => ({
        id: t.id,
        name: `${t.user.firstName} ${t.user.lastName}`,
        busySlots: t.appointments.map((a) => a.scheduledAt),
      })),
    });
  } catch (error) {
    console.error("Availability API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
