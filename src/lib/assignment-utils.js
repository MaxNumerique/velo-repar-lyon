import prisma from "@/lib/prisma";

export async function findTechnicianByLocation(lat, lng) {
  const sectors = await prisma.$queryRaw`
    SELECT id FROM "Sector"
    WHERE ST_Contains(boundary, ST_SetSRID(ST_Point(${lng}, ${lat}), 4326))
    LIMIT 1
  `;

  if (!sectors || sectors.length === 0) {
    return null;
  }

  const sectorId = sectors[0].id;

  const technician = await prisma.user.findFirst({
    where: {
      role: 'TECHNICIAN',
      isAvailable: true,
      sectors: {
        some: { id: sectorId },
      },
    },
    select: { id: true },
  });

  return technician?.id || null;
}
