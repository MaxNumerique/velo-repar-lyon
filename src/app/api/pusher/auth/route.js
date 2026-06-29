import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { withAuth } from "@/lib/auth";

export const POST = withAuth(async (req, params, user) => {
  try {
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
});

