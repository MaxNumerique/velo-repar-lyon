import { apiRequest } from '@/lib/apiClient';

export async function getSectors() {
  return apiRequest('/api/admin/sectors');
}

export async function saveSector(sectorData) {
  return apiRequest('/api/admin/sectors', {
    method: 'POST',
    body: sectorData,
  });
}

export async function deleteSector(id) {
  return apiRequest(`/api/admin/sectors?id=${id}`, {
    method: 'DELETE',
  });
}

