import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/db/prisma";

export async function POST(req) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
}
