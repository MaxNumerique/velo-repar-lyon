export async function getPublicServices() {
  const res = await fetch('/api/services-public')
  if (!res.ok) throw new Error("Impossible de charger les prestations")
  return res.json()
}

export async function getAdminServices() {
  const res = await fetch('/api/admin/services')
  if (!res.ok) throw new Error("Impossible de charger les prestations admin")
  return res.json()
}

export async function deleteAdminService(id) {
  const res = await fetch(`/api/admin/services/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error("Impossible de supprimer la prestation")
  return res.json()
}
