import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function PATCH(req, { params }) {
  try {
    const { requestId, messageId } = await params;
    const { userId: clerkId } = await auth();
    const { content } = await req.json();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.senderId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
      },
    });

    await pusherServer.trigger(
      `presence-conversation-${requestId}`,
      "message-updated",
      updatedMessage,
    );

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("[MESSAGE_PATCH]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { requestId, messageId } = await params;
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.senderId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: "Ce message a été supprimé",
        attachments: [],
      },
    });

    await pusherServer.trigger(
      `presence-conversation-${requestId}`,
      "message-updated",
      updatedMessage,
    );

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("[MESSAGE_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
