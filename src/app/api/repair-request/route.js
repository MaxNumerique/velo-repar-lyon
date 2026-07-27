import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { geocodeAddress } from "@/lib/googleMaps";
import { withAuth } from "@/lib/auth";
import { notifyNewRepairRequest } from "@/lib/webPush";

export const POST = withAuth(async (req, params, user) => {
  const body = await req.json();
  const {
    address,
    description,
    bikeType,
    bikeModel,
    servicePackageId,
    products = [],
    clientInfo,
    scheduledAt,
    technicianId,
    bikePhotos = [],
    issuePhotos = [],
  } = body;

  if (scheduledAt && new Date(scheduledAt) < new Date()) {
    return NextResponse.json(
      { error: "La date d'intervention ne peut pas être dans le passé." },
      { status: 400 },
    );
  }

  if (servicePackageId) {
    const servicePackage = await prisma.servicePackage.findUnique({
      where: { id: servicePackageId },
    });
    if (!servicePackage) {
      return NextResponse.json(
        { error: "Le forfait sélectionné n'est plus disponible au catalogue." },
        { status: 400 },
      );
    }
  }

  const coords = await geocodeAddress(address);
  const lat = coords ? coords.lat : null;
  const lng = coords ? coords.lng : null;

  if (clientInfo) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: user.firstName || clientInfo.firstName,
        lastName: user.lastName || clientInfo.lastName,
        phone: user.phone || clientInfo.phone,
      },
    });
  }

  const bikeBrand = clientInfo ? clientInfo.bikeBrand : null;
  const bikeImageUrl = clientInfo ? clientInfo.bikeImageUrl : null;
  const bikeIndexId = clientInfo ? clientInfo.bikeIndexId : null;
  const clientFirstName = clientInfo ? clientInfo.firstName : user.firstName;
  const clientLastName = clientInfo ? clientInfo.lastName : user.lastName;
  const clientPhone = clientInfo ? clientInfo.phone : user.phone;

  const isScheduled = Boolean(scheduledAt && technicianId && technicianId.trim() !== "");

  const request = await prisma.repairRequest.create({
    data: {
      address,
      description,
      lat,
      lng,
      bikeDetails: {
        brand: bikeBrand,
        model: bikeModel || null,
        type: bikeType || null,
      },
      bikeImageUrl,
      bikeIndexId,
      bikePhotos,
      issuePhotos,
      clientFirstName,
      clientLastName,
      clientPhone,
      clientEmail: user.email,
      userId: user.id,
      servicePackageId: servicePackageId || null,
      products: {
        create: products.map((p) => ({
          productId: p.id,
          quantity: p.quantity,
          price: p.price,
        })),
      },
      ...(isScheduled
        ? {
            technicianId,
            scheduledAt: new Date(scheduledAt),
            status: "SCHEDULED",
          }
        : {}),
    },
    include: {
      products: true,
    },
  });

  await notifyNewRepairRequest(request);

  return NextResponse.json(request, { status: 201 });
});
