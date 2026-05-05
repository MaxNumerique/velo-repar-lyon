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

    // --- PUSH NOTIFICATION LOGIC ---
    try {
      // Find the recipient(s) of the message
      // In this app, a conversation is linked to a RepairRequest
      const request = await prisma.repairRequest.findUnique({
        where: { id: requestId },
        include: {
          user: true, // CLIENT
          appointment: {
            include: {
              technician: {
                include: { user: true } // TECHNICIAN
              }
            }
          }
        }
      });

      if (request) {
        let recipientId = null;
        
        // If sender is CLIENT, notify TECHNICIAN
        if (user.role === 'CLIENT' && request.appointment?.technician?.userId) {
          recipientId = request.appointment.technician.userId;
        } 
        // If sender is TECHNICIAN or ADMIN, notify CLIENT
        else if ((user.role === 'TECHNICIAN' || user.role === 'ADMIN') && request.userId) {
          recipientId = request.userId;
        }

        if (recipientId && recipientId !== user.id) {
          const { sendPushNotification } = await import("@/lib/web-push");
          await sendPushNotification(recipientId, {
            title: `Nouveau message de ${user.firstName || 'Velo Repar'}`,
            body: content.length > 50 ? content.substring(0, 47) + "..." : content,
            url: `/messages?requestId=${requestId}`,
          });
        }
      }
    } catch (pushError) {
      console.error("[PUSH_NOTIFICATION_TRIGGER_ERROR]", pushError);
    }
    // -------------------------------

    return NextResponse.json(message);
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
