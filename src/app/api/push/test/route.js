import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/webPush";
import { withAuth } from "@/lib/auth";

export const POST = withAuth(async (req, params, user) => {
  try {
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
});