import prisma from "@/db/prisma";
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth";

export const GET = withAdmin(async () => {
  const sectorsData = await prisma.sector.findMany({
    include: {
      technicians: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
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
          firstName: t.firstName,
          lastName: t.lastName,
          avatar: t.avatar,
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
    technicianIds = [],
  } = await req.json();
  if (!name || !geojson) {
    return NextResponse.json(
      { error: "Name and geometry are required" },
      { status: 400 },
    );
  }
  const geojsonString = JSON.stringify(geojson);
  const techUserIds = technicianIds;
  if (id) {
    const currentSector = await prisma.sector.findUnique({
      where: { id },
      include: { technicians: { select: { id: true } } },
    });
    const oldTechIds = currentSector?.technicians.map((t) => t.id) || [];
    await prisma.sector.update({
      where: { id },
      data: {
        name,
        color: color || "#3bb2d0",
        technicians: {
          set: techUserIds.map((id) => ({ id })),
        },
      },
    });
    await prisma.$executeRaw`
      UPDATE "Sector" 
      SET boundary = ST_GeomFromGeoJSON(${geojsonString}), 
          "updatedAt" = NOW() 
      WHERE id = ${id}
    `;
    const newTechId = techUserIds[0];
    const oldTechId = oldTechIds[0];
    if (newTechId && oldTechId && newTechId !== oldTechId) {
      console.log(
        `[SECTOR_UPDATE] Reassigning interventions from ${oldTechId} to ${newTechId} in sector ${id}`,
      );
      await prisma.$executeRaw`
        UPDATE "RepairRequest"
        SET "technicianId" = ${newTechId}, "updatedAt" = NOW()
        WHERE "technicianId" = ${oldTechId}
        AND "status" IN ('SCHEDULED', 'EN_ROUTE', 'ON_SITE')
        AND ST_Contains((SELECT boundary FROM "Sector" WHERE id = ${id}), ST_SetSRID(ST_Point(lng, lat), 4326))
      `;
    }
    return NextResponse.json({ message: "Sector updated" });
  } else {
    const newId = `sector_${Math.random().toString(36).substr(2, 9)}`;
    await prisma.$executeRaw`
      INSERT INTO "Sector" (id, name, color, boundary, "createdAt", "updatedAt") 
      VALUES (${newId}, ${name}, ${color || "#3bb2d0"}, ST_GeomFromGeoJSON(${geojsonString}), NOW(), NOW())
    `;
    if (techUserIds.length > 0) {
      await prisma.sector.update({
        where: { id: newId },
        data: {
          technicians: {
            connect: techUserIds.map((id) => ({ id })),
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

  const activeInterventionsCount = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count
    FROM "RepairRequest"
    WHERE "status" IN ('PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE')
    AND "lng" IS NOT NULL
    AND "lat" IS NOT NULL
    AND ST_Contains(
      (SELECT boundary FROM "Sector" WHERE id = ${id}),
      ST_SetSRID(ST_Point(lng, lat), 4326)
    )
  `;

  const count = activeInterventionsCount[0]?.count || 0;
  if (count > 0) {
    return NextResponse.json(
      { error: `Ce secteur contient ${count} intervention(s) active(s). Réassignez-les ou annulez-les avant de le supprimer.` },
      { status: 400 }
    );
  }

  await prisma.sector.delete({
    where: { id },
  });
  return NextResponse.json({ message: "Sector deleted" });
});
