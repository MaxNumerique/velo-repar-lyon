import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
  clerkClient: vi.fn(),
  createClerkClient: vi.fn(() => ({
    users: {
      getUser: vi.fn(),
      updateUser: vi.fn(),
      createUser: vi.fn(),
      deleteUser: vi.fn(),
    },
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
}));
