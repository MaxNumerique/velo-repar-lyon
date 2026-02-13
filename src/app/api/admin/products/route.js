import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function GET(req) {
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

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where = {
      ...(category && category !== 'ALL' ? { category } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      } : {})
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('[PRODUCTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req) {
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

    const body = await req.json()
    const { name, description, price, category, image, isActive } = body

    if (!name || price === undefined) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        image,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('[PRODUCTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
