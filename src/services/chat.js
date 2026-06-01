export async function getConversations() {
  const res = await fetch('/api/conversations')
  if (!res.ok) throw new Error('Impossible de charger les conversations')
  return res.json()
}

export async function getChatMessages(requestId) {
  const res = await fetch(`/api/conversations/${requestId}/messages`)
  if (!res.ok) throw new Error('Impossible de charger les messages')
  return res.json()
}

export async function getIntervention(requestId) {
  const res = await fetch(`/api/interventions/${requestId}`)
  if (!res.ok) throw new Error("Impossible de charger les détails de l'intervention")
  return res.json()
}

export async function sendChatMessage(requestId, content, attachments = []) {
  const res = await fetch(`/api/conversations/${requestId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, attachments }),
  })
  if (!res.ok) throw new Error("Impossible d'envoyer le message")
  return res.json()
}

export async function updateChatMessage(requestId, messageId, content) {
  const res = await fetch(`/api/conversations/${requestId}/messages/${messageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error('Impossible de modifier le message')
  return res.json()
}

export async function deleteChatMessage(requestId, messageId) {
  const res = await fetch(`/api/conversations/${requestId}/messages/${messageId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Impossible de supprimer le message')
  return res.json()
}

export async function toggleChatReaction(requestId, messageId, emoji) {
  const res = await fetch(`/api/conversations/${requestId}/messages/${messageId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emoji }),
  })
  if (!res.ok) throw new Error("Impossible de modifier la réaction")
  return res.json()
}
