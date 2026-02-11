require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const pg = require('pg')

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function check() {
  try {
    const services = await prisma.servicePackage.findMany()
    console.log('--- SERVICES IN DB ---')
    console.log(JSON.stringify(services, null, 2))
  } catch (err) {
    console.error('Check failed:', err)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

check()
