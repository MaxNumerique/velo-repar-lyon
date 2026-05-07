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
      avatar: clerkUser.imageUrl,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      firstName: clerkUser.firstName || fallbackNames.firstName,
      lastName: clerkUser.lastName || fallbackNames.lastName,
      role: isAdminEmail ? 'ADMIN' : 'CLIENT',
      avatar: clerkUser.imageUrl,
    },
  })

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
