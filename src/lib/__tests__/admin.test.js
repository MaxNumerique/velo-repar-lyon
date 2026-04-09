/**
 * Tests unitaires — src/lib/admin.js
 *
 * On teste les wrappers HOF withAdmin, withTechnician et withAuth
 * en mockant @clerk/nextjs/server et @/lib/prisma.
 *
 * Rôles simulés :
 *   - Non authentifié   → 401 Unauthorized
 *   - CLIENT            → 403 Forbidden (pour admin/technician)
 *   - TECHNICIAN        → Accès withTechnician ✅, refus withAdmin ❌
 *   - ADMIN             → Accès à tout ✅
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────

// Mock Clerk
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock user-sync (utilisé dans checkAuth si user introuvable)
vi.mock("@/lib/user-sync", () => ({
  upsertUser: vi.fn(),
}));

// Import APRÈS les mocks
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { upsertUser } from "@/lib/user-sync";
import { withAdmin, withTechnician, withAuth } from "@/lib/admin";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Crée une fausse Request Next.js */
function makeRequest() {
  return new Request("http://localhost/api/test");
}

/** Handler handler qui doit être appelé si l'accès est autorisé */
const okHandler = vi.fn(async () => new Response("OK", { status: 200 }));

// ── Fixtures utilisateurs ──────────────────────────────────────────────────

const adminUser = { id: "admin-1", role: "ADMIN", email: "admin@test.com", firstName: "Admin", lastName: "User" };
const techUser = { id: "tech-1", role: "TECHNICIAN", email: "tech@test.com", firstName: "Tech", lastName: "User", technicianProfile: { id: "tp-1" } };
const clientUser = { id: "client-1", role: "CLIENT", email: "client@test.com", firstName: "Client", lastName: "User" };

// ── beforeEach ────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// withAdmin
// ═══════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════
// withTechnician
// ═══════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════
// withAuth (tous les rôles authentifiés sont acceptés)
// ═══════════════════════════════════════════════════════════════════════════
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
    // Premier appel : user absent de la DB
    prisma.user.findUnique.mockResolvedValue(null);
    // currentUser retourne un objet Clerk
    currentUser.mockResolvedValue({ id: clerkId, emailAddresses: [] });
    // upsertUser crée le user et le retourne
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
    currentUser.mockResolvedValue(null); // Clerk ne connaît pas cet utilisateur

    const handler = withAuth(okHandler);
    const res = await handler(makeRequest(), {});

    expect(okHandler).not.toHaveBeenCalled();
    expect(res.status).toBe(404);
  });
});
