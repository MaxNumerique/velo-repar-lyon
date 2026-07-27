import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/db/prisma";
import { withAdmin, formatClerkErrorMessage } from "@/lib/auth";

export const POST = withAdmin(async (req) => {
  const body = await req.json();
  const { email, firstName, lastName, role, password } = body;
  const client = await clerkClient();
  const username = email.split("@")[0] + Math.floor(Math.random() * 1000);
  try {
    const clerkUser = await client.users.createUser({
      emailAddress: [email],
      username: username,
      firstName,
      lastName,
      password,
      skipPasswordRequirement: false,
      publicMetadata: { role },
    });

    const user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email,
        firstName,
        lastName,
        role,
      },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error("[USERS_POST] Full Error:", JSON.stringify(error, null, 2));
    const message = formatClerkErrorMessage(error);
    return NextResponse.json({ message }, { status: 400 });
  }
});

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const search = searchParams.get("search");
  const where = {
    ...(role && role !== "ALL" ? { role } : {}),
    ...(search
      ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
        }
      : {}),
  };
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
});
