import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function PATCH(req, { params }) {
  try {
    const { userId } = await auth()
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check Admin rights
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    })

    if (admin?.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.json()
    const { role, isBlocked, email, firstName, lastName } = body

    // 1. If email or names change, update Clerk
    if (email || firstName || lastName) {
      const client = await clerkClient()
      
      // We need the clerkId for this user
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { clerkId: true }
      })

      if (currentUser?.clerkId) {
        await client.users.updateUser(currentUser.clerkId, {
          ...(email ? { emailAddress: [email] } : {}),
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
        })
      }
    }

    // 2. Update Prisma
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined ? { role } : {}),
        ...(isBlocked !== undefined ? { isBlocked } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('[USER_ID_PATCH]', error)
    
    let message = 'Une erreur est survenue lors de la mise à jour.'
    if (error.errors?.[0]?.code === 'form_identifier_exists') {
      message = 'Cet email est déjà utilisé par un autre compte.'
    }

    return NextResponse.json({ message }, { status: 400 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth()
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    })

    if (admin?.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Important: Also delete from Clerk in production
    // For now we delete from Prisma
    await prisma.user.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[USER_ID_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
