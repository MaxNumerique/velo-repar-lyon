require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function migrate() {
  console.log('--- Starting User Names Migration ---')

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { firstName: null },
        { lastName: null },
        { firstName: '' },
        { lastName: '' }
      ]
    },
    include: {
      requests: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  console.log(`Found ${users.length} users with missing names.`);

  let updatedCount = 0

  for (const user of users) {
    const latestRequest = user.requests[0]
    if (latestRequest && (latestRequest.clientFirstName || latestRequest.clientLastName)) {
      console.log(`Updating user ${user.email} with names from request: ${latestRequest.clientFirstName} ${latestRequest.clientLastName}`)
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: user.firstName || latestRequest.clientFirstName,
          lastName: user.lastName || latestRequest.clientLastName
        }
      })
      updatedCount++
    } else {
        console.log(`User ${user.email} has no requests or names to recover.`);
    }
  }

  console.log(`--- Migration Finished. Updated ${updatedCount} users. ---`);
}

migrate()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
