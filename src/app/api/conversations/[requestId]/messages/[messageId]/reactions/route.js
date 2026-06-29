import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { pusherServer } from "@/lib/pusher";
import { withAuth } from "@/lib/auth";

export const POST = withAuth(async (req, { params }, user) => {
  try {
    const { requestId, messageId } = params;
    const { emoji } = await req.json();
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    let reactions = Array.isArray(message.reactions) ? message.reactions : [];
    reactions = reactions.map((r) => ({
      ...r,
      userIds: r.userIds.filter((id) => id !== user.id),
    }));
    const existingReactionIndex = reactions.findIndex((r) => r.emoji === emoji);
    const hadSameEmoji = (
      Array.isArray(message.reactions) ? message.reactions : []
    ).some((r) => r.emoji === emoji && r.userIds.includes(user.id));
    if (!hadSameEmoji) {
      if (existingReactionIndex > -1) {
        reactions[existingReactionIndex].userIds.push(user.id);
      } else {
        reactions.push({ emoji, userIds: [user.id] });
      }
    }

    const finalReactions = reactions.filter((r) => r.userIds.length > 0);

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        reactions: finalReactions,
      },
    });
    await pusherServer.trigger(
      `presence-conversation-${requestId}`,
      "message-updated",
      updatedMessage,
    );
    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("[REACTION_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});

