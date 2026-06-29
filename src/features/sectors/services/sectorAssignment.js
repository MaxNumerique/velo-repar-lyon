import prisma from '@/db/prisma';

export async function findTechnicianByLocation(lat, lng) {
  const sectors = await prisma.$queryRaw`
    SELECT id FROM "Sector"
    WHERE ST_Contains(boundary, ST_SetSRID(ST_Point(${lng}, ${lat}), 4326))
    LIMIT 1
  `;
  if (!sectors || sectors.length === 0) {
    return null;
  }

  const technician = await prisma.user.findFirst({
    where: {
      role: 'TECHNICIAN',
      isAvailable: true,
      sectors: {
        some: { id: sectors[0].id },
      },
    },
    select: { id: true },
  });

  return technician?.id || null;
}
