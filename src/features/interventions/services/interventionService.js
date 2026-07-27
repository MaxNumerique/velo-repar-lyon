import { apiRequest } from '@/lib/apiClient';
import { BIKE_TYPES } from '@/features/interventions/constants';

export async function getAdminInterventions(params = '') {
  let queryString = '';
  if (typeof params === 'string') {
    queryString = params;
  } else if (params && typeof params === 'object') {
    queryString = new URLSearchParams(params).toString();
  }
  return apiRequest(`/api/admin/interventions${queryString ? `?${queryString}` : ''}`);
}

export async function getAdminIntervention(id) {
  return apiRequest(`/api/admin/interventions/${id}`);
}

export async function createAdminIntervention(data) {
  return apiRequest('/api/admin/interventions', {
    method: 'POST',
    body: data,
  });
}

export async function updateAdminIntervention(id, data) {
  return apiRequest(`/api/admin/interventions/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

export async function deleteAdminIntervention(id) {
  return apiRequest(`/api/admin/interventions/${id}`, {
    method: 'DELETE',
  });
}

export async function getIntervention(id) {
  return apiRequest(`/api/interventions/${id}`);
}

export async function updateInterventionClient(id, data) {
  return apiRequest(`/api/interventions/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

export async function assignTechnician(lat, lng) {
  return apiRequest(`/api/admin/interventions/assign-technician?lat=${lat}&lng=${lng}`);
}

export async function getAvailability(address) {
  return apiRequest(`/api/availability?address=${encodeURIComponent(address)}`);
}

export async function createRepairRequest(data) {
  return apiRequest('/api/repair-request', {
    method: 'POST',
    body: data,
  });
}

export async function cancelInterventionClient(id) {
  return apiRequest(`/api/interventions/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Normalizes any raw bike type or bike object (e.g. from Bike Index API)
 * to a canonical BIKE_TYPES value.
 */
export function normalizeBikeType(bikeOrType) {
  if (!bikeOrType) return "VILLE";

  if (typeof bikeOrType === 'object') {
    const title = (bikeOrType.title || '').toLowerCase();
    const cycleType = (bikeOrType.cycle_type_slug || '').toLowerCase();
    const propulsion = (bikeOrType.propulsion_type_slug || '').toLowerCase();

    if (propulsion.includes('electric') || propulsion.includes('assist') ||
        title.includes('vae') || title.includes('e-bike') || title.includes('moustache')) {
      return "VAE";
    }
    if (cycleType.includes('mountain') || cycleType.includes('vtt') || title.includes('vtt')) {
      return "VTT";
    }
    if (cycleType.includes('road') || cycleType.includes('route') || title.includes('route') || title.includes('gravel')) {
      return "ROUTE";
    }
    if (cycleType.includes('hybrid') || title.includes('vtc')) {
      return "VTC";
    }
    return "VILLE";
  }

  const t = bikeOrType.toLowerCase();
  if (t.includes("mountain") || t === "vtt") return "VTT";
  if (t.includes("road") || t === "route") return "ROUTE";
  if (t.includes("hybrid") || t === "vtc") return "VTC";
  if (t.includes("electric") || t.includes("vae") || t.includes("e-bike")) return "VAE";
  if (BIKE_TYPES.includes(t.toUpperCase())) return t.toUpperCase();

  return "VILLE";
}

/**
 * Haversine formula to calculate distance between two coordinates in km.
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
