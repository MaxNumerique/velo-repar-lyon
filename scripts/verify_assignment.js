require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testAssignment() {
  console.log("--- Testing Technician Assignment Logic ---");

  // Coordinates for a point in Lyon (Place Bellecour)
  const lat = 45.7578;
  const lng = 4.8320;

  try {
    const sectorTechs = await prisma.$queryRaw`
      SELECT s.name as sector_name, t.id as tech_id
      FROM "TechnicianProfile" t
      JOIN "_TechnicianSectors" ts ON t.id = ts."B"
      JOIN "Sector" s ON ts."A" = s.id
      WHERE ST_Contains(s.boundary, ST_SetSRID(ST_Point(${lng}, ${lat}), 4326))
      LIMIT 1
    `;

    if (sectorTechs.length > 0) {
      console.log("✅ Match found!");
      console.log(`Sector: ${sectorTechs[0].sector_name}`);
      console.log(`Technician ID: ${sectorTechs[0].tech_id}`);
    } else {
      console.log("❌ No technician found for these coordinates.");
      console.log("Suggestion: Verify that your Sectors have boundaries and assigned technicians.");
    }
  } catch (error) {
    console.error("❌ SQL Error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testAssignment();
