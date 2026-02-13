import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function GET(req, { params }) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    // Check Admin rights
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    })

    if (admin?.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return new NextResponse('Product not found', { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('[PRODUCT_ID_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    // Check Admin rights
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    })

    if (admin?.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, description, price, category, image, isActive } = body

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(price !== undefined ? { price: parseFloat(price) } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('[PRODUCT_ID_PATCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    // Check Admin rights
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    })

    if (admin?.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { id } = await params

    // Check if product is being used in any interventions
    const usedInInterventions = await prisma.interventionProduct.findFirst({
      where: { productId: id }
    })

    if (usedInInterventions) {
      // Instead of hard delete, maybe just deactivate? 
      // For now, let's allow blocking delete if used.
      return NextResponse.json(
        { error: 'Ce produit est utilisé dans des interventions et ne peut pas être supprimé. Vous pouvez le désactiver à la place.' }, 
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[PRODUCT_ID_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
