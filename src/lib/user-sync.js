import prisma from './prisma'

export async function upsertUser(clerkUser) {
  if (!clerkUser) return null

  const email = clerkUser.emailAddresses[0]?.emailAddress
  if (!email) return null

  // Check if this is the designated admin
  const isAdminEmail = email === process.env.GOOGLE_EMAIL

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
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

  return user
}
