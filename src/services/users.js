export async function getCurrentUser() {
  const res = await fetch('/api/admin/users/me')
  if (!res.ok) throw new Error("Impossible de charger l'utilisateur")
  return res.json()
}

export async function updateCurrentUser(profileData) {
  const res = await fetch('/api/admin/users/me', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  })
  if (!res.ok) throw new Error("Impossible de mettre à jour le profil")
  return res.json()
}

export async function getAdminUsers(params = '') {
  const res = await fetch(`/api/admin/users${params ? `?${params}` : ''}`)
  if (!res.ok) throw new Error("Impossible de charger les utilisateurs")
  return res.json()
}

export async function createAdminUser(userData) {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  if (!res.ok) throw new Error("Impossible de créer l'utilisateur")
  return res.json()
}

export async function updateAdminUser(id, userData) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  if (!res.ok) throw new Error("Impossible de modifier l'utilisateur")
  return res.json()
}

export async function deleteAdminUser(id) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error("Impossible de supprimer l'utilisateur")
  return res.json()
}

export async function getTechnicians() {
  const res = await fetch('/api/admin/users?role=TECHNICIAN')
  if (!res.ok) throw new Error("Impossible de charger les techniciens")
  return res.json()
}
