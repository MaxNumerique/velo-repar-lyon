import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { withAuth } from "@/lib/auth";
import { canModifyIntervention } from "@/lib/dateUtils";
import { geocodeAddress } from "@/lib/googleMaps";

export const GET = withAuth(async (req, { params }, user) => {
  const { id } = params;
  const intervention = await prisma.repairRequest.findUnique({
    where: { id },
    include: {
      user: true,
      servicePackage: true,
      technician: true,
    },
  });
  if (!intervention) {
    return NextResponse.json({ error: "Intervention non trouvée" }, { status: 404 });
  }
  if (intervention.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  return NextResponse.json(intervention);
});

export const PATCH = withAuth(async (req, { params }, user) => {
  const { id } = params;
  const body = await req.json();
  const {
    description,
    address,
    bikeModel,
    bikeType,
    clientFirstName,
    clientLastName,
    clientPhone,
    bikePhotos,
    issuePhotos,
    servicePackageId,
    scheduledAt,
    bikeBrand,
  } = body;
  if (scheduledAt && new Date(scheduledAt) < new Date()) {
    return NextResponse.json(
      { error: "La date d'intervention ne peut pas être dans le passé." },
      { status: 400 },
    );
  }

  const intervention = await prisma.repairRequest.findUnique({
    where: { id },
    include: { appointment: true },
  });
  if (!intervention) {
    return NextResponse.json({ error: "Intervention non trouvée" }, { status: 404 });
  }
  if (intervention.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  if (!canModifyIntervention(intervention.appointment?.scheduledAt)) {
    return NextResponse.json(
      { error: "Modification impossible moins de 6h avant l'intervention" },
      { status: 400 },
    );
  }
  let geoData = {};
  if (address && address !== intervention.address) {
    const coords = await geocodeAddress(address);
    if (coords) {
      geoData = { lat: coords.lat, lng: coords.lng };
    }
  }
  const updated = await prisma.repairRequest.update({
    where: { id },
    data: {
      description,
      address,
      bikeDetails: {
        brand: bikeBrand || intervention.bikeDetails?.brand,
        model: bikeModel || intervention.bikeDetails?.model,
        type: bikeType || intervention.bikeDetails?.type,
      },
      clientFirstName,
      clientLastName,
      clientPhone,
      bikePhotos,
      issuePhotos,
      servicePackageId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      ...geoData,
    },
  });
  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (req, { params }, user) => {
  const { id } = params;
  const intervention = await prisma.repairRequest.findUnique({
    where: { id },
    include: { appointment: true },
  });
  if (!intervention) {
    return NextResponse.json({ error: "Intervention non trouvée" }, { status: 404 });
  }
  if (intervention.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  if (!canModifyIntervention(intervention.appointment?.scheduledAt)) {
    return NextResponse.json(
      { error: "Annulation impossible moins de 6h avant l'intervention" },
      { status: 400 },
    );
  }
  await prisma.repairRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  return NextResponse.json({ message: "Intervention annulée" });
});
