import { apiRequest } from '@/lib/apiClient';

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
  let queryString = '';
  if (typeof params === 'string') {
    queryString = params;
  } else if (params && typeof params === 'object') {
    queryString = new URLSearchParams(params).toString();
  }
  return apiRequest(`/api/admin/users${queryString ? `?${queryString}` : ''}`);
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
  return getAdminUsers({ role: 'TECHNICIAN' });
}
