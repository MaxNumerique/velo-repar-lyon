import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        technicianProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let conversations = [];

    if (user.role === "TECHNICIAN" && user.technicianProfile) {
      // Get conversations for technician (where they are assigned to the request)
      conversations = await prisma.conversation.findMany({
        where: {
          request: {
            appointment: {
              technicianId: user.technicianProfile.id,
            },
          },
        },
        include: {
          request: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    } else if (user.role === "CLIENT") {
      // Get conversations for client
      conversations = await prisma.conversation.findMany({
        where: {
          request: {
            userId: user.id,
          },
        },
        include: {
          request: {
            include: {
              appointment: {
                include: {
                  technician: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                          role: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    } else if (user.role === "ADMIN") {
      // Admins can see everything
      conversations = await prisma.conversation.findMany({
        include: {
          request: {
            include: {
              user: true,
              appointment: {
                include: {
                  technician: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    }

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("[CONVERSATIONS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
