import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/db/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const body = await req.formData();
    const socketId = body.get("socket_id");
    const channel = body.get("channel_name");

    const presenceData = {
      user_id: user.id,
      user_info: {
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      },
    };

    const authResponse = pusherServer.authorizeChannel(
      socketId,
      channel,
      presenceData,
    );
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("[PUSHER_AUTH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
