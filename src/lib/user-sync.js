import { createClerkClient } from '@clerk/nextjs/server'
import prisma from './prisma'

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function upsertUser(clerkUser) {
  if (!clerkUser) return null

  const email = clerkUser.emailAddresses[0]?.emailAddress
  if (!email) return null

  // Check if this is the designated admin
  const isAdminEmail = email === process.env.GOOGLE_EMAIL

  // Fallback: search for a name in existing RepairRequests if Clerk doesn't provide it
  let fallbackNames = { firstName: null, lastName: null }
  if (!clerkUser.firstName || !clerkUser.lastName) {
    const latestRequest = await prisma.repairRequest.findFirst({
      where: { clientEmail: email },
      orderBy: { createdAt: 'desc' },
      select: { clientFirstName: true, clientLastName: true }
    })
    if (latestRequest) {
      fallbackNames = {
        firstName: latestRequest.clientFirstName,
        lastName: latestRequest.clientLastName
      }
    }
  }

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email,
      firstName: clerkUser.firstName || fallbackNames.firstName,
      lastName: clerkUser.lastName || fallbackNames.lastName,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      firstName: clerkUser.firstName || fallbackNames.firstName,
      lastName: clerkUser.lastName || fallbackNames.lastName,
      role: isAdminEmail ? 'ADMIN' : 'CLIENT',
    },
  })

  // If it's an admin and doesn't have a profile yet, create one
  if (user.role === 'ADMIN') {
    await prisma.adminProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    })
  }

  // Sync role to Clerk publicMetadata if different
  const currentRole = clerkUser.publicMetadata?.role
  if (currentRole !== user.role) {
    await clerkClient.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: {
        role: user.role
      }
    })
  }

  return user
}
