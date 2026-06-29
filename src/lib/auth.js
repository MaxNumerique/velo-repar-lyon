import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/db/prisma";
import { NextResponse } from "next/server";
import { upsertUser } from "@/db/userSync";

export async function checkAdmin() {
  const user = await checkAuth();

  if (user?.role !== "ADMIN") {
    throw { response: new NextResponse("Forbidden", { status: 403 }) };
  }

  return user;
}

export async function checkTechnician() {
  const user = await checkAuth();

  if (user?.role !== "TECHNICIAN" && user?.role !== "ADMIN") {
    throw { response: new NextResponse("Forbidden", { status: 403 }) };
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

export function withAdmin(handler) {
  return async (req, context) => {
    try {
      const admin = await checkAdmin();
      const resolvedContext = await resolveParams(context);
      return handler(req, resolvedContext, admin);
    } catch (error) {
      if (error.response) return error.response;
      console.error("[ADMIN_AUTH_WRAPPER]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  };
}

export function withTechnician(handler) {
  return async (req, context) => {
    try {
      const user = await checkTechnician();
      const resolvedContext = await resolveParams(context);
      return handler(req, resolvedContext, user);
    } catch (error) {
      if (error.response) return error.response;
      console.error("[TECHNICIAN_AUTH_WRAPPER]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  };
}

export async function checkAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw { response: new NextResponse("Unauthorized", { status: 401 }) };
  }

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
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
    throw { response: new NextResponse("User not found", { status: 404 }) };
  }

  return user;
}

export function withAuth(handler) {
  return async (req, context) => {
    try {
      const user = await checkAuth();
      const resolvedContext = await resolveParams(context);
      return handler(req, resolvedContext, user);
    } catch (error) {
      if (error.response) return error.response;
      console.error("[AUTH_WRAPPER]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  };
}
