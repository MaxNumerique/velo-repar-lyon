export async function getAdminInterventions(params = '') {
  const res = await fetch(`/api/admin/interventions${params ? `?${params}` : ''}`)
  if (!res.ok) throw new Error("Impossible de charger les interventions")
  return res.json()
}

export async function getAdminIntervention(id) {
  const res = await fetch(`/api/admin/interventions/${id}`)
  if (!res.ok) throw new Error("Impossible de charger l'intervention")
  return res.json()
}

export async function createAdminIntervention(data) {
  const res = await fetch('/api/admin/interventions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error("Impossible de créer l'intervention")
  return res.json()
}

export async function updateAdminIntervention(id, data) {
  const res = await fetch(`/api/admin/interventions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error("Impossible de modifier l'intervention")
  return res.json()
}

export async function deleteAdminIntervention(id) {
  const res = await fetch(`/api/admin/interventions/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error("Impossible de supprimer l'intervention")
  return res.json()
}

export async function getIntervention(id) {
  const res = await fetch(`/api/interventions/${id}`)
  if (!res.ok) throw new Error("Impossible de charger l'intervention")
  return res.json()
}

export async function updateInterventionClient(id, data) {
  const res = await fetch(`/api/interventions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error("Impossible de modifier l'intervention")
  return res.json()
}

export async function assignTechnician(lat, lng) {
  const res = await fetch(`/api/admin/interventions/assign-technician?lat=${lat}&lng=${lng}`)
  if (!res.ok) throw new Error("Impossible d'assigner le technicien")
  return res.json()
}

export async function getAvailability(address) {
  const res = await fetch(`/api/availability?address=${encodeURIComponent(address)}`)
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || "Impossible de charger les disponibilités")
  }
  return res.json()
}

export async function createRepairRequest(data) {
  const res = await fetch('/api/repair-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || "Impossible d'envoyer la demande de réparation")
  }
  return res.json()
}
