import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { withAuth } from "@/lib/auth";

export const GET = withAuth(async (req, params, user) => {
  try {
    const where = {

      ...(user.role === "TECHNICIAN" ? { technicianId: user.id } : {}),
      ...(user.role === "CLIENT" ? { userId: user.id } : {}),
      // Admin sees everything
    };

    const interventions = await prisma.repairRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // We map to stay compatible with frontend expecting a "conversation" structure
    const formattedConversations = interventions.map(req => ({
      id: req.id,
      requestId: req.id,
      isOpen: req.isChatOpen,
      request: req,
      messages: req.messages,
      updatedAt: req.updatedAt,
    }));

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error("[CONVERSATIONS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
