import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { withAdmin, withTechnician } from "@/lib/auth";
import { notifyInterventionStatusUpdate } from "@/lib/webPush";

export const PATCH = withTechnician(async (req, { params }, user) => {
  const { id } = params;
  const intervention = await prisma.repairRequest.findUnique({
    where: { id }
  });
  if (!intervention) {
    return NextResponse.json({ error: "Intervention not found" }, { status: 404 });
  }
  if (user.role !== "ADMIN" && intervention.technicianId !== user.id) {
    return NextResponse.json({ error: "Unauthorized to update this intervention" }, { status: 403 });
  }
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
    address,
    products,
  } = body;
  const result = await prisma.$transaction(async (tx) => {
    let dataToUpdate = {};

    if (user.role === "ADMIN") {
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

      const existingDetails = intervention.bikeDetails || {};
      const bikeBrand = body.bikeBrand || existingDetails.brand || null;
      const bikeModel = body.bikeModel || existingDetails.model || null;
      const bikeType = body.bikeType || existingDetails.type || null;

      dataToUpdate = {
        description,
        clientFirstName,
        clientLastName,
        clientPhone,
        clientEmail,
        bikeDetails: {
          brand: bikeBrand,
          model: bikeModel,
          type: bikeType,
        },
        bikeImageUrl: body.bikeImageUrl,
        address,
        ...autoUserIdUpdate,
        ...(status ? { status } : {}),
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
        ...(technicianId ? { technicianId } : {}),
      };
    } else {
      dataToUpdate = {
        ...(status ? { status } : {}),
      };
    }
    const request = await tx.repairRequest.update({
      where: { id },
      data: dataToUpdate,
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
          data: products.map((p) => {
            const match = productRecords.find((pr) => pr.id === p.productId);
            return {
              requestId: id,
              productId: p.productId,
              quantity: p.quantity || 1,
              price: match ? match.price : 0,
            };
          }),
        });
      }
    }
    return request;
  });

  if (status) {
    try {
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
