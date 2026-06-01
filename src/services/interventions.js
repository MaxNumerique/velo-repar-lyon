import { apiRequest } from '@/lib/api-client';

export async function getAdminInterventions(params = '') {
  return apiRequest(`/api/admin/interventions${params ? `?${params}` : ''}`);
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


