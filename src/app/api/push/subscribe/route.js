import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { withAuth } from "@/lib/auth";

export const POST = withAuth(async (req, params, user) => {
  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId: user.id,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    create: {
      userId: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });
  return NextResponse.json({ success: true });
});
