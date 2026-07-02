import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { checkAuth } from "@/lib/auth";
import { runSeed } from "../../../../../../prisma/seedData";

export async function POST(req) {
  let isAuthorized = false;
  
  // Verify either via system token or an authenticated admin session
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret") || req.headers.get("x-seed-secret");
  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
  
  if (CLERK_SECRET_KEY && secret === CLERK_SECRET_KEY) {
    isAuthorized = true;
  } else {
    try {
      const user = await checkAuth();
      if (user && user.role === "ADMIN") {
        isAuthorized = true;
      }
    } catch (e) {
      // Ignored
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSeed(prisma);
    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Seeding error via API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
