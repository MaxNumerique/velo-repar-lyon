import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Fetch sectors with technicians using Prisma
    // We can use Prisma for everything except the spatial boundary
    const sectorsData = await prisma.sector.findMany({
      include: {
        technicians: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 2. Fetch spatial boundaries separately or via direct query
    // Since we need boundaries as GeoJSON, we'll keep the raw query but optimized
    const sectors = await Promise.all(sectorsData.map(async (s) => {
      const [{ boundary }] = await prisma.$queryRaw`
        SELECT ST_AsGeoJSON(boundary)::json as boundary 
        FROM "Sector" 
        WHERE id = ${s.id}
      `;
      
      return {
        ...s,
        boundary,
        technicians: s.technicians.map(t => ({
          id: t.id,
          ...t.user
        }))
      };
    }));

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
      technicianIds = [], // These are userIds from the frontend
    } = await request.json();

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

    // Standard Prisma delete (handles the technicians relationship implicitly if needed)
    await prisma.sector.delete({
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
