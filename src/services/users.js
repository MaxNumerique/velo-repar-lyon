import { apiRequest } from '@/lib/api-client';

export async function getCurrentUser() {
  return apiRequest('/api/admin/users/me');
}

export async function updateCurrentUser(profileData) {
  return apiRequest('/api/admin/users/me', {
    method: 'PATCH',
    body: profileData,
  });
}

export async function getAdminUsers(params = '') {
  return apiRequest(`/api/admin/users${params ? `?${params}` : ''}`);
}

export async function createAdminUser(userData) {
  return apiRequest('/api/admin/users', {
    method: 'POST',
    body: userData,
  });
}

export async function updateAdminUser(id, userData) {
  return apiRequest(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: userData,
  });
}

export async function deleteAdminUser(id) {
  return apiRequest(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
}

export async function getTechnicians() {
  return apiRequest('/api/admin/users?role=TECHNICIAN');
}
