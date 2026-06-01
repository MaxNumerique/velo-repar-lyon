import { apiRequest } from '@/lib/api-client';

export async function getBikes() {
  return apiRequest('/api/bikes');
}

export async function createBike(bikeData) {
  return apiRequest('/api/bikes', {
    method: 'POST',
    body: bikeData,
  });
}

export async function updateBike(id, bikeData) {
  return apiRequest(`/api/bikes/${id}`, {
    method: 'PATCH',
    body: bikeData,
  });
}

export async function deleteBike(id) {
  return apiRequest(`/api/bikes/${id}`, {
    method: 'DELETE',
  });
}

export async function searchBikes(query, options = {}) {
  return apiRequest(`/api/bikes/search?query=${encodeURIComponent(query)}`, options);
}

