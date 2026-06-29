import { apiRequest } from '@/lib/apiClient';

export async function getPublicProducts() {
  return apiRequest('/api/products-public');
}

export async function getAdminProducts(params = '') {
  return apiRequest(`/api/admin/products${params ? `?${params}` : ''}`);
}

export async function updateAdminProduct(id, productData) {
  return apiRequest(`/api/admin/products/${id}`, {
    method: 'PATCH',
    body: productData,
  });
}

export async function deleteAdminProduct(id) {
  return apiRequest(`/api/admin/products/${id}`, {
    method: 'DELETE',
  });
}


