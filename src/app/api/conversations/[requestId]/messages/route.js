import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { pusherServer } from "@/lib/pusher";
import { withAuth } from "@/lib/auth";
import { sendPushNotification } from "@/lib/webPush";

export const GET = withAuth(async (req, { params }, user) => {
  const { requestId } = params;
  const messages = await prisma.message.findMany({
    where: { requestId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
});

export const POST = withAuth(async (req, { params }, user) => {
  const { requestId } = params;
  const { content, attachments = [] } = await req.json();
  const message = await prisma.message.create({
    data: {
      requestId,
      senderId: user.id,
      senderRole: user.role,
      content,
      attachments: { set: attachments },
    },
  });

  await prisma.repairRequest.update({
    where: { id: requestId },
    data: { updatedAt: new Date() },
  });

  await pusherServer.trigger(
    `presence-conversation-${requestId}`,
    "new-message",
    message,
  );

  const request = await prisma.repairRequest.findUnique({
    where: { id: requestId },
    include: {
      user: true,
      technician: true,
    },
  });

  if (request) {
    const recipientsSet = new Set();
    if (request.userId) recipientsSet.add(request.userId);
    if (request.technicianId) recipientsSet.add(request.technicianId);

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    admins.forEach((admin) => recipientsSet.add(admin.id));

    const senderName = user.firstName || 'Vélo du Pelo';
    const bodyText = content.length > 50 ? content.substring(0, 47) + "..." : content;

    for (const recipientId of recipientsSet) {
      if (recipientId !== user.id) {
        try {
          await sendPushNotification(recipientId, {
            title: `Nouveau message de ${senderName}`,
            body: bodyText,
            url: `/messages?requestId=${requestId}`,
          });
        } catch (pushErr) {
          console.error(`[PUSH_ERROR] Failed to send push to ${recipientId}:`, pushErr);
        }
      }
    }
  }

  return NextResponse.json(message);
});
