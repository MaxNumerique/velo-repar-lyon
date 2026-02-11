import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma' 

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
    const { title, description, price, duration_min, image } = body

    if (!title || !price || !duration_min) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const service = await prisma.servicePackage.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        duration_min: parseInt(duration_min),
        image,
      }
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('[SERVICES_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

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

    const services = await prisma.servicePackage.findMany({
      orderBy: { price: 'asc' }
    })

    console.log('Fetched services count:', services.length)
    if (services.length > 0) {
      console.log('First service keys:', Object.keys(services[0]))
    }

    return NextResponse.json(services)
  } catch (error) {
    console.error('[SERVICES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
