import { apiRequest } from '@/lib/apiClient';

export async function getPublicServices() {
  return apiRequest('/api/services-public');
}

export async function getAdminServices() {
  return apiRequest('/api/admin/services');
}

export async function deleteAdminService(id) {
  return apiRequest(`/api/admin/services/${id}`, {
    method: 'DELETE',
  });
}
