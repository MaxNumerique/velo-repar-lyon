import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock("@/db/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/db/userSync", () => ({
  upsertUser: vi.fn(),
}));

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/db/prisma";
import { upsertUser } from "@/db/userSync";
import { withAdmin, withTechnician, withAuth } from "@/lib/auth";

function makeRequest() {
  return new Request("http://localhost/api/test");
}

const okHandler = vi.fn(async () => new Response("OK", { status: 200 }));

const adminUser = { id: "admin-1", role: "ADMIN", email: "admin@test.com", firstName: "Admin", lastName: "User" };
const techUser = { id: "tech-1", role: "TECHNICIAN", email: "tech@test.com", firstName: "Tech", lastName: "User", technicianProfile: { id: "tp-1" } };
const clientUser = { id: "client-1", role: "CLIENT", email: "client@test.com", firstName: "Client", lastName: "User" };


beforeEach(() => {
  vi.clearAllMocks();
});

describe("withAdmin", () => {
  it("appelle le handler si le user est ADMIN", async () => {
    auth.mockResolvedValue({ userId: "clerk-admin" });
    prisma.user.findUnique.mockResolvedValue(adminUser);

    const handler = withAdmin(okHandler);
    const res = await handler(makeRequest(), {});

    expect(okHandler).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });

  it("retourne 401 si l'utilisateur n'est pas authentifié", async () => {
    auth.mockResolvedValue({ userId: null });

    const handler = withAdmin(okHandler);
    const res = await handler(makeRequest(), {});

    expect(okHandler).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });

  it("retourne 403 si le user est CLIENT", async () => {
    auth.mockResolvedValue({ userId: "clerk-client" });
    prisma.user.findUnique.mockResolvedValue(clientUser);

    const handler = withAdmin(okHandler);
    const res = await handler(makeRequest(), {});

    expect(okHandler).not.toHaveBeenCalled();
    expect(res.status).toBe(403);
  });

  it("retourne 403 si le user est TECHNICIAN", async () => {
    auth.mockResolvedValue({ userId: "clerk-tech" });
    prisma.user.findUnique.mockResolvedValue(techUser);

    const handler = withAdmin(okHandler);
    const res = await handler(makeRequest(), {});

    expect(okHandler).not.toHaveBeenCalled();
    expect(res.status).toBe(403);
  });
});

describe("withTechnician", () => {
  it("appelle le handler si le user est TECHNICIAN", async () => {
    auth.mockResolvedValue({ userId: "clerk-tech" });
    prisma.user.findUnique.mockResolvedValue(techUser);

    const handler = withTechnician(okHandler);
    const res = await handler(makeRequest(), {});

    expect(okHandler).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });

  it("appelle le handler si le user est ADMIN (admin peut tout faire)", async () => {
    auth.mockResolvedValue({ userId: "clerk-admin" });
    prisma.user.findUnique.mockResolvedValue(adminUser);

    const handler = withTechnician(okHandler);
    const res = await handler(makeRequest(), {});

    expect(okHandler).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });

  it("retourne 401 si l'utilisateur n'est pas authentifié", async () => {
    auth.mockResolvedValue({ userId: null });

    const handler = withTechnician(okHandler);
    const res = await handler(makeRequest(), {});

    expect(okHandler).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });

  it("retourne 403 si le user est CLIENT", async () => {
    auth.mockResolvedValue({ userId: "clerk-client" });
    prisma.user.findUnique.mockResolvedValue(clientUser);

    const handler = withTechnician(okHandler);
    const res = await handler(makeRequest(), {});

    expect(okHandler).not.toHaveBeenCalled();
    expect(res.status).toBe(403);
  });
});

describe("withAuth", () => {
  it("appelle le handler pour un CLIENT authentifié", async () => {
    auth.mockResolvedValue({ userId: "clerk-client" });
    prisma.user.findUnique.mockResolvedValue(clientUser);

    const handler = withAuth(okHandler);
    const res = await handler(makeRequest(), {});

    expect(okHandler).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });

  it("appelle le handler pour un TECHNICIAN authentifié", async () => {
    auth.mockResolvedValue({ userId: "clerk-tech" });
    prisma.user.findUnique.mockResolvedValue(techUser);

    const handler = withAuth(okHandler);
    const res = await handler(makeRequest(), {});

    expect(okHandler).toHaveBeenCalledOnce();
  });

  it("appelle le handler pour un ADMIN authentifié", async () => {
    auth.mockResolvedValue({ userId: "clerk-admin" });
    prisma.user.findUnique.mockResolvedValue(adminUser);

    const handler = withAuth(okHandler);
    const res = await handler(makeRequest(), {});

    expect(okHandler).toHaveBeenCalledOnce();
  });

  it("retourne 401 si l'utilisateur n'est pas authentifié", async () => {
    auth.mockResolvedValue({ userId: null });

    const handler = withAuth(okHandler);
    const res = await handler(makeRequest(), {});

    expect(okHandler).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });

  it("synchronise l'utilisateur Clerk si absent de la base", async () => {
    const clerkId = "clerk-new-user";
    const syncedUser = { id: "user-new", role: "CLIENT", email: "new@test.com" };

    auth.mockResolvedValue({ userId: clerkId });
    prisma.user.findUnique.mockResolvedValue(null);
    currentUser.mockResolvedValue({ id: clerkId, emailAddresses: [] });
    upsertUser.mockResolvedValue(syncedUser);

    const handler = withAuth(okHandler);
    const res = await handler(makeRequest(), {});

    expect(upsertUser).toHaveBeenCalledOnce();
    expect(okHandler).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });

  it("retourne 404 si le user n'est ni en base ni synchronisable depuis Clerk", async () => {
    auth.mockResolvedValue({ userId: "clerk-ghost" });
    prisma.user.findUnique.mockResolvedValue(null);
    currentUser.mockResolvedValue(null);

    const handler = withAuth(okHandler);
    const res = await handler(makeRequest(), {});

    expect(okHandler).not.toHaveBeenCalled();
    expect(res.status).toBe(404);
  });
});
