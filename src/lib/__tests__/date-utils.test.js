import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  formatDate,
  formatTime,
  formatFullDate,
  isSameSlot,
  canModifyIntervention,
  getAvailableDays,
} from "@/lib/date-utils";

describe("formatDate", () => {
  it("retourne une chaîne vide si la valeur est falsy", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
    expect(formatDate("")).toBe("");
  });

  it("retourne une chaîne vide si la date est invalide", () => {
    expect(formatDate("pas-une-date")).toBe("");
  });

  it("formate une date ISO en français (ex. '12 janvier 2025')", () => {
    const result = formatDate("2025-01-12T10:00:00Z");
    expect(result).toMatch(/12/);
    expect(result).toMatch(/janvier|janv/i);
    expect(result).toMatch(/2025/);
  });
});

describe("formatTime", () => {
  it("retourne une chaîne vide si la valeur est falsy", () => {
    expect(formatTime(null)).toBe("");
    expect(formatTime("")).toBe("");
  });

  it("retourne une chaîne vide si la date est invalide", () => {
    expect(formatTime("invalide")).toBe("");
  });

  it("retourne une heure au format HH:MM", () => {
    const result = formatTime("2025-06-15T14:30:00Z");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});
describe("formatFullDate", () => {
  it("retourne une chaîne vide pour une valeur invalide", () => {
    expect(formatFullDate("")).toBe("");
    expect(formatFullDate("invalid")).toBe("");
  });

  it("inclut le jour de la semaine en français", () => {
    const result = formatFullDate("2025-01-06T00:00:00");
    expect(result).toMatch(/lundi/i);
  });
});

describe("isSameSlot", () => {
  it("retourne false si l'une des dates est falsy", () => {
    expect(isSameSlot(null, "2025-01-01")).toBe(false);
    expect(isSameSlot("2025-01-01", null)).toBe(false);
    expect(isSameSlot(null, null)).toBe(false);
  });

  it("retourne true pour deux dates avec la même heure exacte", () => {
    expect(isSameSlot("2025-06-15T10:00:00", "2025-06-15T10:30:00")).toBe(true);
  });

  it("retourne false pour deux dates avec des heures différentes", () => {
    expect(isSameSlot("2025-06-15T10:00:00", "2025-06-15T11:00:00")).toBe(false);
  });

  it("retourne false pour deux jours différents à la même heure", () => {
    expect(isSameSlot("2025-06-15T10:00:00", "2025-06-16T10:00:00")).toBe(false);
  });
});

describe("canModifyIntervention", () => {
  it("retourne true si scheduledAt est falsy", () => {
    expect(canModifyIntervention(null)).toBe(true);
    expect(canModifyIntervention(undefined)).toBe(true);
  });

  it("retourne true si le RDV est dans plus de 6h", () => {
    const future = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString();
    expect(canModifyIntervention(future)).toBe(true);
  });

  it("retourne false si le RDV est dans moins de 6h", () => {
    const soon = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    expect(canModifyIntervention(soon)).toBe(false);
  });

  it("retourne false si le RDV est dans le passé", () => {
    const past = new Date(Date.now() - 3600 * 1000).toISOString();
    expect(canModifyIntervention(past)).toBe(false);
  });
});

describe("getAvailableDays", () => {
  it("retourne exactement N jours par défaut (7)", () => {
    const days = getAvailableDays();
    expect(days).toHaveLength(7);
  });

  it("respecte le count passé en paramètre", () => {
    expect(getAvailableDays(3)).toHaveLength(3);
    expect(getAvailableDays(14)).toHaveLength(14);
  });

  it("n'inclut aucun samedi ni dimanche", () => {
    const days = getAvailableDays(14);
    for (const day of days) {
      const dow = day.getDay();
      expect(dow).not.toBe(0);
      expect(dow).not.toBe(6);
    }
  });

  it("retourne des objets Date", () => {
    const days = getAvailableDays(3);
    for (const day of days) {
      expect(day).toBeInstanceOf(Date);
    }
  });
});
