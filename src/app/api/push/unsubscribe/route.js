import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { withAuth } from "@/lib/auth";

export const POST = withAuth(async (req, params, user) => {
  try {


    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint is required" }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint: endpoint
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUSH_UNSUBSCRIBE_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
