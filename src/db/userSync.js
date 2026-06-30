import { createClerkClient } from '@clerk/nextjs/server'
import prisma from './prisma'

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function upsertUser(clerkUser) {
  if (!clerkUser) {
    throw new Error('[USER_SYNC_ERROR] clerkUser is required');
  }
  const email = clerkUser.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    throw new Error(`[USER_SYNC_ERROR] Email is required for user ${clerkUser.id}`);
  }
  const isAdminEmail = email === process.env.GOOGLE_EMAIL
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

  const existingEmailUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, clerkId: true }
  })
  if (existingEmailUser && existingEmailUser.clerkId !== clerkUser.id) {
    console.log(`[USER_SYNC] Reconciling clerkId for existing email: ${email}`)
    await prisma.user.update({
      where: { id: existingEmailUser.id },
      data: { clerkId: clerkUser.id }
    })
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
