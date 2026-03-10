import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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
      technicianProfile: {
        select: { id: true },
      },
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
 * Wrapper for technician rights (admins also allowed).
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
