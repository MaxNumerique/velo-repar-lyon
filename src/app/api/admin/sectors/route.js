import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin";

export const GET = withAdmin(async () => {
  // 1. Fetch sectors with technicians using Prisma
  const sectorsData = await prisma.sector.findMany({
    include: {
      technicians: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Fetch spatial boundaries separately or via direct query
  const sectors = await Promise.all(
    sectorsData.map(async (s) => {
      const [{ boundary }] = await prisma.$queryRaw`
      SELECT ST_AsGeoJSON(boundary)::json as boundary 
      FROM "Sector" 
      WHERE id = ${s.id}
    `;

      return {
        ...s,
        boundary,
        technicians: s.technicians.map((t) => ({
          id: t.id,
          ...t.user,
        })),
      };
    }),
  );

  return NextResponse.json(sectors);
});

export const POST = withAdmin(async (req) => {
  const {
    id,
    name,
    geojson,
    color,
    technicianIds = [], // These are userIds from the frontend
  } = await req.json();

  if (!name || !geojson) {
    return NextResponse.json(
      { error: "Name and geometry are required" },
      { status: 400 },
    );
  }

  const geojsonString = JSON.stringify(geojson);

  // Resolve technician record IDs from user IDs
  const techs = await prisma.technicianProfile.findMany({
    where: { userId: { in: technicianIds } },
    select: { id: true },
  });
  const techProfileIds = techs.map((t) => t.id);

  if (id) {
    // 1. Get current technicians for comparison
    const currentSector = await prisma.sector.findUnique({
      where: { id },
      include: { technicians: { select: { id: true } } },
    });

    const oldTechIds = currentSector?.technicians.map((t) => t.id) || [];

    // Update metadata and relationships with Prisma
    await prisma.sector.update({
      where: { id },
      data: {
        name,
        color: color || "#3bb2d0",
        technicians: {
          set: techProfileIds.map((id) => ({ id })),
        },
      },
    });

    // Update spatial data with SQL
    await prisma.$executeRaw`
      UPDATE "Sector" 
      SET boundary = ST_GeomFromGeoJSON(${geojsonString}), 
          "updatedAt" = NOW() 
      WHERE id = ${id}
    `;

    // 2. Handle Intervention Reassignment
    // If technician(s) changed, reassign active interventions in this sector
    const newTechId = techProfileIds[0];
    const oldTechId = oldTechIds[0];

    if (newTechId && oldTechId && newTechId !== oldTechId) {
      console.log(
        `[SECTOR_UPDATE] Reassigning interventions from ${oldTechId} to ${newTechId} in sector ${id}`,
      );

      // Update all active appointments for the old technician that are geographically within this sector
      await prisma.$executeRaw`
        UPDATE "Appointment"
        SET "technicianId" = ${newTechId}, "updatedAt" = NOW()
        WHERE "technicianId" = ${oldTechId}
        AND "status" IN ('SCHEDULED', 'EN_ROUTE', 'ON_SITE')
        AND "requestId" IN (
          SELECT r.id 
          FROM "RepairRequest" r, "Sector" s
          WHERE s.id = ${id}
          AND ST_Contains(s.boundary, ST_SetSRID(ST_Point(r.lng, r.lat), 4326))
        )
      `;
    }

    return NextResponse.json({ message: "Sector updated" });
  } else {
    // Create new sector
    const newId = `sector_${Math.random().toString(36).substr(2, 9)}`;

    // Create base record with SQL (needed for boundary)
    await prisma.$executeRaw`
      INSERT INTO "Sector" (id, name, color, boundary, "createdAt", "updatedAt") 
      VALUES (${newId}, ${name}, ${color || "#3bb2d0"}, ST_GeomFromGeoJSON(${geojsonString}), NOW(), NOW())
    `;

    // Update relationships with Prisma
    if (techProfileIds.length > 0) {
      await prisma.sector.update({
        where: { id: newId },
        data: {
          technicians: {
            connect: techProfileIds.map((id) => ({ id })),
          },
        },
      });
    }

    return NextResponse.json({ message: "Sector created", id: newId });
  }
});

export const DELETE = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  // Standard Prisma delete
  await prisma.sector.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Sector deleted" });
});
