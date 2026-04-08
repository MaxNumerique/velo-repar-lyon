import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin, withTechnician } from "@/lib/admin";

export const PATCH = withTechnician(async (req, { params }) => {
  const { id } = await params;
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
    products, // Array of { productId, quantity }
  } = body;

  const result = await prisma.$transaction(async (tx) => {
    // 0. Auto-linking logic on update
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

    // 1. Determine corresponding RequestStatus
    let requestStatus = status;
    const reqStatusMap = {
      SCHEDULED: "ASSIGNED",
      EN_ROUTE: "IN_PROGRESS",
      ON_SITE: "IN_PROGRESS",
      COMPLETED: "COMPLETED",
      CANCELLED: "CANCELLED",
    };

    if (reqStatusMap[status]) {
      requestStatus = reqStatusMap[status];
    }

    // 2. Update RepairRequest
    const request = await tx.repairRequest.update({
      where: { id },
      data: {
        status: requestStatus,
        description,
        clientFirstName,
        clientLastName,
        clientPhone,
        clientEmail,
        bikeModel,
        bikeType,
        address,
        ...autoUserIdUpdate,
      },
    });

    // 3. Update Appointment (including its own status if valid)
    const apptStatuses = [
      "SCHEDULED",
      "EN_ROUTE",
      "ON_SITE",
      "COMPLETED",
      "CANCELLED",
    ];
    if (apptStatuses.includes(status) || scheduledAt || technicianId) {
      await tx.appointment.update({
        where: { requestId: id },
        data: {
          ...(apptStatuses.includes(status) ? { status: status } : {}),
          ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
          ...(technicianId ? { technicianId } : {}),
        },
      });
    }

    // Sync Products
    if (products !== undefined) {
      // Delete current associations
      await tx.interventionProduct.deleteMany({
        where: { requestId: id },
      });

      // Add new ones
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

  return NextResponse.json(result);
});

export const GET = withAdmin(async (req, { params }) => {
  const { id } = await params;
  const intervention = await prisma.repairRequest.findUnique({
    where: { id },
    include: {
      user: true,
      bike: true,
      servicePackage: true,
      products: {
        include: {
          product: true,
        },
      },
      appointment: {
        include: {
          technician: {
            include: {
              user: true,
            },
          },
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
  const { id } = await params;

  await prisma.$transaction(async (tx) => {
    // Delete appointment first due to relation
    await tx.appointment.deleteMany({
      where: { requestId: id },
    });

    await tx.repairRequest.delete({
      where: { id },
    });
  });

  return NextResponse.json({ message: "Intervention deleted" });
});
