import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { upsertUser } from "@/lib/user-sync";

/**
 * Checks if the current user has ADMIN role.
 * Returns the admin user object if successful.
 * Throws an error with a NextResponse if unauthorized or forbidden.
 */
export async function checkAdmin() {
  const { userId } = await auth();

  if (!userId) {
    throw { response: new NextResponse("Unauthorized", { status: 401 }) };
  }

  const admin = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      role: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (admin?.role !== "ADMIN") {
    throw { response: new NextResponse("Forbidden", { status: 403 }) };
  }

  return admin;
}

/**
 * Checks if the current user has TECHNICIAN or ADMIN role.
 */
export async function checkTechnician() {
  const { userId } = await auth();

  if (!userId) {
    throw { response: new NextResponse("Unauthorized", { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      role: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (user?.role !== "TECHNICIAN" && user?.role !== "ADMIN") {
    throw { response: new NextResponse("Forbidden", { status: 403 }) };
  }

  return user;
}

/**
 * Higher-order function/wrapper for API handlers to enforce admin rights.
 */
export function withAdmin(handler) {
  return async (req, params) => {
    try {
      const admin = await checkAdmin();
      return handler(req, params, admin);
    } catch (error) {
      if (error.response) return error.response;
      console.error("[ADMIN_AUTH_WRAPPER]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  };
}

/**
 * Higher-order function/wrapper for API handlers to enforce technician rights (admins also allowed).
 */
export function withTechnician(handler) {
  return async (req, params) => {
    try {
      const user = await checkTechnician();
      return handler(req, params, user);
    } catch (error) {
      if (error.response) return error.response;
      console.error("[TECHNICIAN_AUTH_WRAPPER]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  };
}

/**
 * Higher-order function/wrapper for API handlers to enforce basic authentication.
 * Allows any role (CLIENT, TECHNICIAN, ADMIN).
 */
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
    // If user not in DB, sync from Clerk
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
  return async (req, params) => {
    try {
      const user = await checkAuth();
      return handler(req, params, user);
    } catch (error) {
      if (error.response) return error.response;
      console.error("[AUTH_WRAPPER]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  };
}
