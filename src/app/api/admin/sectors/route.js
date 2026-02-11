import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sectors = await prisma.$queryRaw`
      SELECT 
        s.id, 
        s.name, 
        s.color,
        ST_AsGeoJSON(s.boundary)::json as boundary,
        COALESCE(
          json_agg(
            json_build_object('id', u.id, 'firstName', u."firstName", 'lastName', u."lastName")
          ) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) as technicians
      FROM "Sector" s
      LEFT JOIN "_TechnicianSectors" ts ON s.id = ts."B"
      LEFT JOIN "TechnicianProfile" tp ON ts."A" = tp.id
      LEFT JOIN "User" u ON tp."userId" = u.id
      GROUP BY s.id, s.color
      ORDER BY s."createdAt" DESC
    `;
    return NextResponse.json(sectors);
  } catch (error) {
    console.error("Error fetching sectors:", error);
    return NextResponse.json(
      { error: "Failed to fetch sectors" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const {
      id,
      name,
      geojson,
      color,
      technicianIds = [],
    } = await request.json();

    if (!name || !geojson) {
      return NextResponse.json(
        { error: "Name and geometry are required" },
        { status: 400 },
      );
    }

    const geojsonString = JSON.stringify(geojson);

    if (id) {
      // Update existing sector
      await prisma.$executeRaw`
        UPDATE "Sector" 
        SET name = ${name}, 
            color = ${color || "#3bb2d0"},
            boundary = ST_GeomFromGeoJSON(${geojsonString}), 
            "updatedAt" = NOW() 
        WHERE id = ${id}
      `;

      const techs = await prisma.technicianProfile.findMany({
        where: { userId: { in: technicianIds } },
        select: { id: true },
      });
      const techProfileIds = techs.map((t) => t.id);

      await prisma.sector.update({
        where: { id },
        data: {
          technicians: {
            set: techProfileIds.map((techId) => ({ id: techId })),
          },
        },
      });

      return NextResponse.json({ message: "Sector updated" });
    } else {
      // Create new sector
      const newId = `sector_${Math.random().toString(36).substr(2, 9)}`;

      await prisma.$executeRaw`
        INSERT INTO "Sector" (id, name, color, boundary, "createdAt", "updatedAt") 
        VALUES (${newId}, ${name}, ${color || "#3bb2d0"}, ST_GeomFromGeoJSON(${geojsonString}), NOW(), NOW())
      `;

      if (technicianIds.length > 0) {
        const techs = await prisma.technicianProfile.findMany({
          where: { userId: { in: technicianIds } },
          select: { id: true },
        });
        const techProfileIds = techs.map((t) => t.id);

        await prisma.sector.update({
          where: { id: newId },
          data: {
            technicians: {
              connect: techProfileIds.map((techId) => ({ id: techId })),
            },
          },
        });
      }

      return NextResponse.json({ message: "Sector created", id: newId });
    }
  } catch (error) {
    console.error("Error saving sector:", error);
    return NextResponse.json(
      { error: "Failed to save sector" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.sector.deleteMany({
      where: { id },
    });

    return NextResponse.json({ message: "Sector deleted" });
  } catch (error) {
    console.error("Error deleting sector:", error);
    return NextResponse.json(
      { error: "Failed to delete sector" },
      { status: 500 },
    );
  }
}
