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
