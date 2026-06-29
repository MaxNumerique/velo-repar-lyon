import { apiRequest } from '@/lib/apiClient';

export async function getConversations() {
  return apiRequest('/api/conversations');
}

export async function getChatMessages(requestId) {
  return apiRequest(`/api/conversations/${requestId}/messages`);
}

export async function getIntervention(requestId) {
  return apiRequest(`/api/interventions/${requestId}`);
}

export async function sendChatMessage(requestId, content, attachments = []) {
  return apiRequest(`/api/conversations/${requestId}/messages`, {
    method: 'POST',
    body: { content, attachments },
  });
}

export async function updateChatMessage(requestId, messageId, content) {
  return apiRequest(`/api/conversations/${requestId}/messages/${messageId}`, {
    method: 'PATCH',
    body: { content },
  });
}

export async function deleteChatMessage(requestId, messageId) {
  return apiRequest(`/api/conversations/${requestId}/messages/${messageId}`, {
    method: 'DELETE',
  });
}

export async function toggleChatReaction(requestId, messageId, emoji) {
  return apiRequest(`/api/conversations/${requestId}/messages/${messageId}/reactions`, {
    method: 'POST',
    body: { emoji },
  });
}

