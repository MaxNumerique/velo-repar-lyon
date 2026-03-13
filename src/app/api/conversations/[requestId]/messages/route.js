import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function GET(req, { params }) {
  try {
    const { requestId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversation: {
          requestId: requestId,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[MESSAGES_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { requestId } = await params;
    const { userId: clerkId } = await auth();
    const { content, attachments = [] } = await req.json();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: { requestId },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { requestId },
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        senderRole: user.role,
        content,
        attachments: { set: attachments },
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Trigger Pusher event
    await pusherServer.trigger(
      `presence-conversation-${requestId}`,
      "new-message",
      message,
    );

    return NextResponse.json(message);
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
