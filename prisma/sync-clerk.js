const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const pg = require('pg')
try {
  require('dotenv').config()
} catch (e) {
  // dotenv ignored in prod
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

async function syncClerkUsers() {
  if (!CLERK_SECRET_KEY) {
    console.error('CLERK_SECRET_KEY is missing in .env');
    return;
  }

  console.log('Fetching users from Clerk...');

  try {
    const response = await fetch('https://api.clerk.com/v1/users?limit=500', {
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Clerk API error: ${JSON.stringify(error)}`);
    }

    const clerkUsers = await response.json();
    console.log(`Found ${clerkUsers.length} users on Clerk.`);

    for (const clerkUser of clerkUsers) {
      const email = clerkUser.email_addresses[0]?.email_address;
      const role = clerkUser.public_metadata?.role || 'CLIENT';

      console.log(`   - Syncing: ${email} (${role})`);

      await prisma.user.upsert({
        where: { clerkId: clerkUser.id },
        update: {
          email,
          firstName: clerkUser.first_name,
          lastName: clerkUser.last_name,
          avatar: clerkUser.image_url,
          role: role,
        },
        create: {
          clerkId: clerkUser.id,
          email,
          firstName: clerkUser.first_name,
          lastName: clerkUser.last_name,
          avatar: clerkUser.image_url,
          role: role,
        },
      });
    }

    console.log('✨ Sync finished successfully!');
  } catch (error) {
    console.error('❌ Error during sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncClerkUsers();
