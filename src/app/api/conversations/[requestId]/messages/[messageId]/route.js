import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { pusherServer } from "@/lib/pusher";
import { withAuth } from "@/lib/auth";

export const PATCH = withAuth(async (req, { params }, user) => {
  try {
    const { requestId, messageId } = params;
    const { content } = await req.json();
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
});

export const DELETE = withAuth(async (req, { params }, user) => {
  try {
    const { requestId, messageId } = params;
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
});
