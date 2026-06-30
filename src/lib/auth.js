import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/db/prisma";
import { NextResponse } from "next/server";
import { upsertUser } from "@/db/userSync";

export async function checkAdmin() {
  const user = await checkAuth();
  if (user?.role !== "ADMIN") {
    throw { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return user;
}

export async function checkTechnician() {
  const user = await checkAuth();
  if (user?.role !== "TECHNICIAN" && user?.role !== "ADMIN") {
    throw { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return user;
}

async function resolveParams(context) {
  if (context && context.params) {
    return {
      ...context,
      params: await context.params,
    };
  }
  return context;
}

function createAuthWrapper(checkFn, label) {
  return (handler) => {
    return async (req, context) => {
      try {
        const user = await checkFn();
        const resolvedContext = await resolveParams(context);
        return handler(req, resolvedContext, user);
      } catch (error) {
        if (error.response) return error.response;
        console.error(`[${label}]`, error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
      }
    };
  };
}

export const withAdmin = createAuthWrapper(checkAdmin, "ADMIN_AUTH_WRAPPER");
export const withTechnician = createAuthWrapper(checkTechnician, "TECHNICIAN_AUTH_WRAPPER");

export async function checkAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      role: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });
  if (!user) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      user = await upsertUser(clerkUser);
    }
  }
  if (!user) {
    throw { response: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }
  return user;
}

export const withAuth = createAuthWrapper(checkAuth, "AUTH_WRAPPER");
