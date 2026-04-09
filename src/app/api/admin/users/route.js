import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/admin";

export const POST = withAdmin(async (req) => {
  const body = await req.json();
  const { email, firstName, lastName, role, password } = body;

  // 1. Create in Clerk
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

    // 2. Create in Prisma
    const user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email,
        firstName,
        lastName,
        role,
      },
    });

    // 3. If Technician, create profile
    if (role === "TECHNICIAN") {
      await prisma.technicianProfile.create({
        data: { userId: user.id },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USERS_POST] Full Error:", JSON.stringify(error, null, 2));

    let message = "Une erreur est survenue lors de la création.";
    const clerkErrorCode = error.errors?.[0]?.code || error.code;

    if (clerkErrorCode === "form_password_length_too_short") {
      message = "Le mot de passe doit faire au moins 8 caractères.";
    } else if (clerkErrorCode === "form_identifier_exists") {
      message = "Cet email est déjà utilisé.";
    } else if (clerkErrorCode === "form_password_pwned") {
      message =
        "Ce mot de passe est trop commun et a été compromis dans une fuite de données. Veuillez en choisir un autre.";
    } else if (
      clerkErrorCode === "form_data_missing" &&
      error.errors?.[0]?.longMessage?.includes("username")
    ) {
      message =
        "Le système requiert un nom d'utilisateur (username) qui est manquant ou invalide.";
    } else if (error.message) {
      message = error.message;
    }

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
    include: {
      technicianProfile: true,
      adminProfile: true,
    },
  });

  return NextResponse.json(users);
});
