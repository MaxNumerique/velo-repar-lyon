import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { withAuth } from "@/lib/auth";

export const POST = withAuth(async (req, params, user) => {
  const { endpoint } = await req.json();
  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint is required" }, { status: 400 });
  }
  await prisma.pushSubscription.deleteMany({
    where: { endpoint },
  });
  return NextResponse.json({ success: true });
});
