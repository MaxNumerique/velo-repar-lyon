import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/db/prisma";
import { sendPushNotification } from "@/lib/webPush";

export async function POST(req) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await sendPushNotification(user.id, {
      title: "Test de notification",
      body: "Bravo ! Les notifications push fonctionnent correctement sur votre appareil.",
      url: "/profile"
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUSH_TEST_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
