import prisma from "@/lib/prisma";

/**
 * Finds the first available technician in the sector containing the given coordinates.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string|null>} - Technician ID or null if none found
 */
export async function findTechnicianByLocation(lat, lng) {
  // 1. Find the sector containing the point
  // Note: We use queryRaw because of the PostGIS spatial function
  const sectors = await prisma.$queryRaw`
    SELECT id FROM "Sector"
    WHERE ST_Contains(boundary, ST_SetSRID(ST_Point(${lng}, ${lat}), 4326))
    LIMIT 1
  `;

  if (!sectors || sectors.length === 0) {
    return null;
  }

  const sectorId = sectors[0].id;

  // 2. Find an available technician in this sector
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
