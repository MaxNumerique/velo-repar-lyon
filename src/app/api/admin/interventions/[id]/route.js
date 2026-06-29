import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { withAdmin, withTechnician } from "@/lib/auth";

export const PATCH = withTechnician(async (req, { params }) => {
  const { id } = params;
  const body = await req.json();
  const {
    status,
    description,
    scheduledAt,
    technicianId,
    clientFirstName,
    clientLastName,
    clientPhone,
    clientEmail,
    bikeModel,
    bikeType,
    address,
    products,
  } = body;

  const result = await prisma.$transaction(async (tx) => {
    let autoUserIdUpdate = {};
    if (clientEmail) {
      const existingUser = await tx.user.findUnique({
        where: { email: clientEmail },
        select: { id: true }
      });
      if (existingUser) {
        autoUserIdUpdate = { userId: existingUser.id };
      }
    }

    const request = await tx.repairRequest.update({
      where: { id },
      data: {
        description,
        clientFirstName,
        clientLastName,
        clientPhone,
        clientEmail,
        bikeDetails: {
          brand: body.bikeBrand || body.bikeDetails?.brand,
          model: body.bikeModel || body.bikeDetails?.model,
          type: body.bikeType || body.bikeDetails?.type,
        },
        bikeImageUrl: body.bikeImageUrl,
        address,
        ...autoUserIdUpdate,
        ...(status ? { status } : {}),
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
        ...(technicianId ? { technicianId } : {}),
      },
    });

    if (products !== undefined) {
      await tx.interventionProduct.deleteMany({
        where: { requestId: id },
      });

      if (products.length > 0) {
        const productRecords = await tx.product.findMany({
          where: { id: { in: products.map((p) => p.productId) } },
        });

        await tx.interventionProduct.createMany({
          data: products.map((p) => ({
            requestId: id,
            productId: p.productId,
            quantity: p.quantity || 1,
            price:
              productRecords.find((pr) => pr.id === p.productId)?.price || 0,
          })),
        });
      }
    }

    return request;
  });

  if (status) {
    try {
      const { notifyInterventionStatusUpdate } = await import("@/lib/webPush");
      await notifyInterventionStatusUpdate(id, status);
    } catch (pushError) {
      console.error("[PUSH_NOTIFICATION_TRIGGER_ERROR]", pushError);
    }
  }

  return NextResponse.json(result);
});

export const GET = withAdmin(async (req, { params }) => {
  const { id } = params;
  const intervention = await prisma.repairRequest.findUnique({
    where: { id },
    include: {
      user: true,
      bike: true,
      servicePackage: true,
      technician: true,
      products: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!intervention) {
    return NextResponse.json(
      { error: "Intervention not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(intervention);
});

export const DELETE = withAdmin(async (req, { params }) => {
  const { id } = params;

  await prisma.repairRequest.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Intervention deleted" });
});
