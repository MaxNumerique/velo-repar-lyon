import { apiRequest } from '@/lib/api-client';

export async function subscribePush(subscriptionData) {
  return apiRequest('/api/push/subscribe', {
    method: 'POST',
    body: subscriptionData,
  });
}

export async function unsubscribePush(endpoint) {
  return apiRequest('/api/push/unsubscribe', {
    method: 'POST',
    body: { endpoint },
  });
}

export async function testPush() {
  return apiRequest('/api/push/test', {
    method: 'POST',
  });
}
