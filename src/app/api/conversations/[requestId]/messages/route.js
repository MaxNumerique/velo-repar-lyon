import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/db/prisma";
import { pusherServer } from "@/lib/pusher";

export async function GET(req, { params }) {
  try {
    const { requestId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await prisma.message.findMany({
      where: { requestId },
      orderBy: { createdAt: "asc" },
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

    const message = await prisma.message.create({
      data: {
        requestId,
        senderId: user.id,
        senderRole: user.role,
        content,
        attachments: { set: attachments },
      },
    });

    // Update RepairRequest updatedAt
    await prisma.repairRequest.update({
      where: { id: requestId },
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
          technician: true, // TECHNICIAN
        }
      });

      if (request) {
        const recipientsSet = new Set();
        
        // 1. Add Client
        if (request.userId) {
          recipientsSet.add(request.userId);
        }

        // 2. Add Technician (if assigned)
        if (request.technicianId) {
          recipientsSet.add(request.technicianId);
        }

        // 3. Add all Admins
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true }
        });
        admins.forEach(admin => recipientsSet.add(admin.id));

        const { sendPushNotification } = await import("@/lib/webPush");
        
        // Send to all identified recipients (except sender)
        const recipientIds = Array.from(recipientsSet);
        for (const recipientId of recipientIds) {
          if (recipientId !== user.id) {
            await sendPushNotification(recipientId, {
              title: `Nouveau message de ${user.firstName || 'Velo Repar'}`,
              body: content.length > 50 ? content.substring(0, 47) + "..." : content,
              url: `/messages?requestId=${requestId}`,
            });
          }
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
