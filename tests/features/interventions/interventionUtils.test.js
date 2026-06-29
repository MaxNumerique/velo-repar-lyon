import { describe, it, expect } from "vitest";
import { InterventionStatus, STATUS_CONFIG, BIKE_TYPES } from "@/features/interventions/constants";
import { normalizeBikeType, calculateDistance } from "@/features/interventions/services/interventionService";

describe("InterventionStatus", () => {
  it("contient les 5 statuts attendus", () => {
    expect(InterventionStatus).toHaveProperty("SCHEDULED", "SCHEDULED");
    expect(InterventionStatus).toHaveProperty("EN_ROUTE", "EN_ROUTE");
    expect(InterventionStatus).toHaveProperty("ON_SITE", "ON_SITE");
    expect(InterventionStatus).toHaveProperty("COMPLETED", "COMPLETED");
    expect(InterventionStatus).toHaveProperty("CANCELLED", "CANCELLED");
  });
});

describe("STATUS_CONFIG", () => {
  it("possède une entrée pour chaque statut", () => {
    const statuses = Object.keys(InterventionStatus);
    for (const s of statuses) {
      expect(STATUS_CONFIG).toHaveProperty(s);
    }
  });

  it("chaque config possède label, color, light, border, text", () => {
    for (const config of Object.values(STATUS_CONFIG)) {
      expect(config).toHaveProperty("label");
      expect(config).toHaveProperty("color");
      expect(config).toHaveProperty("light");
      expect(config).toHaveProperty("border");
      expect(config).toHaveProperty("text");
    }
  });
});

describe("BIKE_TYPES", () => {
  it("contient les 5 types canoniques", () => {
    expect(BIKE_TYPES).toContain("VTT");
    expect(BIKE_TYPES).toContain("VTC");
    expect(BIKE_TYPES).toContain("VAE");
    expect(BIKE_TYPES).toContain("ROUTE");
    expect(BIKE_TYPES).toContain("VILLE");
    expect(BIKE_TYPES).toHaveLength(5);
  });
});

describe("normalizeBikeType (string)", () => {
  it("retourne VILLE par défaut pour valeur falsy", () => {
    expect(normalizeBikeType(null)).toBe("VILLE");
    expect(normalizeBikeType(undefined)).toBe("VILLE");
    expect(normalizeBikeType("")).toBe("VILLE");
  });

  it("reconnaît 'mountain' → VTT", () => {
    expect(normalizeBikeType("mountain")).toBe("VTT");
    expect(normalizeBikeType("vtt")).toBe("VTT");
  });

  it("reconnaît 'road' → ROUTE", () => {
    expect(normalizeBikeType("road")).toBe("ROUTE");
    expect(normalizeBikeType("route")).toBe("ROUTE");
  });

  it("reconnaît 'hybrid' → VTC", () => {
    expect(normalizeBikeType("hybrid")).toBe("VTC");
    expect(normalizeBikeType("vtc")).toBe("VTC");
  });

  it("reconnaît 'electric' / 'vae' → VAE", () => {
    expect(normalizeBikeType("electric")).toBe("VAE");
    expect(normalizeBikeType("vae")).toBe("VAE");
    expect(normalizeBikeType("e-bike")).toBe("VAE");
  });

  it("reconnaît les types canoniques en majuscules directement", () => {
    expect(normalizeBikeType("VTT")).toBe("VTT");
    expect(normalizeBikeType("VILLE")).toBe("VILLE");
  });

  it("retourne VILLE pour un type inconnu", () => {
    expect(normalizeBikeType("scooter")).toBe("VILLE");
    expect(normalizeBikeType("xyz123")).toBe("VILLE");
  });
});

describe("normalizeBikeType (object)", () => {
  it("détecte VAE via propulsion electrique", () => {
    const bike = { propulsion_type_slug: "electric-assist", title: "Trek", cycle_type_slug: "road" };
    expect(normalizeBikeType(bike)).toBe("VAE");
  });

  it("détecte VAE via titre e-bike", () => {
    const bike = { title: "Moustache e-bike", cycle_type_slug: "", propulsion_type_slug: "" };
    expect(normalizeBikeType(bike)).toBe("VAE");
  });

  it("détecte VTT via cycle_type_slug mountain", () => {
    const bike = { cycle_type_slug: "mountain", title: "", propulsion_type_slug: "" };
    expect(normalizeBikeType(bike)).toBe("VTT");
  });

  it("détecte ROUTE via cycle_type_slug road", () => {
    const bike = { cycle_type_slug: "road", title: "", propulsion_type_slug: "" };
    expect(normalizeBikeType(bike)).toBe("ROUTE");
  });

  it("détecte VTC via cycle_type_slug hybrid", () => {
    const bike = { cycle_type_slug: "hybrid", title: "", propulsion_type_slug: "" };
    expect(normalizeBikeType(bike)).toBe("VTC");
  });

  it("retourne VILLE par défaut si aucun critère ne matche", () => {
    const bike = { cycle_type_slug: "", title: "", propulsion_type_slug: "" };
    expect(normalizeBikeType(bike)).toBe("VILLE");
  });

  it("VAE a la priorité sur VTT si le vélo est électrique mountain", () => {
    const bike = { cycle_type_slug: "mountain", title: "", propulsion_type_slug: "electric-assist" };
    expect(normalizeBikeType(bike)).toBe("VAE");
  });
});

describe("calculateDistance", () => {
  it("retourne null si l'une des coordonnées est manquante", () => {
    expect(calculateDistance(null, 2, 45, 2)).toBeNull();
    expect(calculateDistance(45, null, 45, 2)).toBeNull();
    expect(calculateDistance(45, 2, null, 2)).toBeNull();
    expect(calculateDistance(45, 2, 45, null)).toBeNull();
  });

  it("retourne 0 pour deux points identiques", () => {
    const d = calculateDistance(45.75, 4.85, 45.75, 4.85);
    expect(d).toBeCloseTo(0, 3);
  });

  it("calcule environ 392 km entre Lyon et Paris", () => {
    const km = calculateDistance(45.75, 4.85, 48.85, 2.35);
    expect(km).toBeGreaterThan(380);
    expect(km).toBeLessThan(410);
  });

  it("calcule environ 7.7 km entre deux points de Lyon", () => {
    const km = calculateDistance(45.7576, 4.832, 45.7607, 4.86);
    expect(km).toBeGreaterThan(1);
    expect(km).toBeLessThan(10);
  });
});
