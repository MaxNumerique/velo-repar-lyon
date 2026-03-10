/**
 * Intervention Utilities and Constants
 */

export const RequestStatus = {
  PENDING: "PENDING",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

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
    requestStatus: RequestStatus.ASSIGNED,
  },
  EN_ROUTE: {
    label: "En route",
    color: "bg-cyan-500",
    light: "bg-cyan-50",
    border: "border-cyan-100",
    text: "text-cyan-600",
    requestStatus: RequestStatus.IN_PROGRESS,
  },
  ON_SITE: {
    label: "Sur place",
    color: "bg-rose-500",
    light: "bg-rose-50",
    border: "border-rose-100",
    text: "text-rose-600",
    requestStatus: RequestStatus.IN_PROGRESS,
  },
  COMPLETED: {
    label: "Terminé",
    color: "bg-emerald-500",
    light: "bg-emerald-50",
    border: "border-emerald-100",
    text: "text-emerald-600",
    requestStatus: RequestStatus.COMPLETED,
  },
  CANCELLED: {
    label: "Annulé",
    color: "bg-red-500",
    light: "bg-red-50",
    border: "border-red-100",
    text: "text-red-600",
    requestStatus: RequestStatus.CANCELLED,
  },
};

/**
 * Haversine formula to calculate distance between two coordinates in km
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the earth in km
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

/**
 * Maps appointment status to request status
 */
export function getRequestStatusFromAppointment(apptStatus) {
  return STATUS_CONFIG[apptStatus]?.requestStatus || RequestStatus.PENDING;
}
