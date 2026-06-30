import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAdminForm } from "@/features/admin/hooks/useAdminForm";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/notifications", () => ({
  showToast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const initialData = { name: "", price: 0, active: true };
const serverData  = { name: "Révision complète", price: 79, active: true };

function makeOptions(overrides = {}) {
  return {
    id: null,
    basePath: "/api/admin/products",
    initialData,
    entityToast: { created: vi.fn(), updated: vi.fn() },
    redirectPath: "/admin/products",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
});

describe("useAdminForm — mode création", () => {
  it("initialise formData avec initialData", () => {
    const opts = makeOptions();
    const { result } = renderHook(() => useAdminForm(opts));
    expect(result.current.formData).toEqual(initialData);
  });

  it("loading est false dès le départ (pas d'id)", () => {
    const opts = makeOptions();
    const { result } = renderHook(() => useAdminForm(opts));
    expect(result.current.loading).toBe(false);
  });

  it("saving est false au départ", () => {
    const opts = makeOptions();
    const { result } = renderHook(() => useAdminForm(opts));
    expect(result.current.saving).toBe(false);
  });

  it("updateField met à jour un champ correctement", () => {
    const opts = makeOptions();
    const { result } = renderHook(() => useAdminForm(opts));
    act(() => {
      result.current.updateField("name", "Révision complète");
    });
    expect(result.current.formData.name).toBe("Révision complète");
  });

  it("updateField ne réinitialise pas les autres champs", () => {
    const opts = makeOptions();
    const { result } = renderHook(() => useAdminForm(opts));
    act(() => {
      result.current.updateField("price", 49.99);
    });
    expect(result.current.formData.active).toBe(true);
    expect(result.current.formData.name).toBe("");
  });

  it("handleSubmit appelle fetch POST et entityToast.created() en cas de succès", async () => {
    const opts = makeOptions();
    fetch.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useAdminForm(opts));
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/products",
      expect.objectContaining({ method: "POST" })
    );
    expect(opts.entityToast.created).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalledWith("/admin/products");
  });

  it("handleSubmit affiche une erreur si la réponse n'est pas ok", async () => {
    const { showToast } = await import("@/lib/notifications");
    const opts = makeOptions();
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Erreur serveur" }),
    });
    const { result } = renderHook(() => useAdminForm(opts));
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(showToast.error).toHaveBeenCalledWith("Erreur serveur");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("handleSubmit affiche 'Erreur réseau' si fetch rejette", async () => {
    const { showToast } = await import("@/lib/notifications");
    const opts = makeOptions();
    fetch.mockRejectedValue(new Error("Network Error"));
    const { result } = renderHook(() => useAdminForm(opts));
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(showToast.error).toHaveBeenCalledWith("Erreur réseau");
  });
});

describe("useAdminForm — mode édition", () => {
  it("loading démarre à true puis passe à false après le fetch initial", async () => {
    const opts = makeOptions({ id: "product-42" });
    fetch.mockResolvedValue({ ok: true, json: async () => serverData });
    const { result } = renderHook(() => useAdminForm(opts));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("charge les données du serveur dans formData", async () => {
    const opts = makeOptions({ id: "product-42" });
    fetch.mockResolvedValue({ ok: true, json: async () => serverData });
    const { result } = renderHook(() => useAdminForm(opts));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.formData).toEqual(serverData);
  });

  it("redirige vers redirectPath si le chargement initial échoue", async () => {
    const opts = makeOptions({ id: "product-42" });
    fetch.mockResolvedValue({ ok: false });
    const { result } = renderHook(() => useAdminForm(opts));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockPush).toHaveBeenCalledWith("/admin/products");
  });

  it("handleSubmit appelle fetch PATCH avec l'id et entityToast.updated()", async () => {
    const opts = makeOptions({ id: "product-42" });
    fetch.mockImplementation((url, init) => {
      if (init?.method === "PATCH") {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ ok: true, json: async () => serverData });
    });
    const { result } = renderHook(() => useAdminForm(opts));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(fetch).toHaveBeenLastCalledWith(
      "/api/admin/products/product-42",
      expect.objectContaining({ method: "PATCH" })
    );
    expect(opts.entityToast.updated).toHaveBeenCalledOnce();
  });
});

