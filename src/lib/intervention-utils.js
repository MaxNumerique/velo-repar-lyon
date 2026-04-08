/**
 * Intervention Utilities and Constants
 */

export const AppointmentStatus = {
  SCHEDULED: "SCHEDULED",
  EN_ROUTE: "EN_ROUTE",
  ON_SITE: "ON_SITE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export const STATUS_CONFIG = {
  SCHEDULED: {
    label: "Programmé",
    color: "bg-violet-500",
    light: "bg-violet-50",
    border: "border-violet-100",
    text: "text-violet-600",
  },
  EN_ROUTE: {
    label: "En route",
    color: "bg-cyan-500",
    light: "bg-cyan-50",
    border: "border-cyan-100",
    text: "text-cyan-600",
  },
  ON_SITE: {
    label: "Sur place",
    color: "bg-rose-500",
    light: "bg-rose-50",
    border: "border-rose-100",
    text: "text-rose-600",
  },
  COMPLETED: {
    label: "Terminé",
    color: "bg-emerald-500",
    light: "bg-emerald-50",
    border: "border-emerald-100",
    text: "text-emerald-600",
  },
  CANCELLED: {
    label: "Annulé",
    color: "bg-red-500",
    light: "bg-red-50",
    border: "border-red-100",
    text: "text-red-600",
  },
};

/** Canonical list of bike types stored in DB */
export const BIKE_TYPES = ["VTT", "VTC", "VAE", "ROUTE", "VILLE"];

/**
 * Normalizes any raw bike type string (e.g. from Bike Index API)
 * to a canonical BIKE_TYPES value.
 */
export function normalizeBikeType(bikeType) {
  if (!bikeType) return "";
  const t = bikeType.toLowerCase();
  if (t.includes("mountain") || t === "vtt") return "VTT";
  if (t.includes("road") || t === "route") return "ROUTE";
  if (t.includes("hybrid") || t === "vtc") return "VTC";
  if (t.includes("electric") || t.includes("vae") || t.includes("e-bike")) return "VAE";
  if (BIKE_TYPES.includes(t.toUpperCase())) return t.toUpperCase();
  return "VILLE";
}

/**
 * Haversine formula to calculate distance between two coordinates in km
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
