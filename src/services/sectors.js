export async function getSectors() {
  const res = await fetch('/api/admin/sectors')
  if (!res.ok) throw new Error("Impossible de charger les secteurs")
  return res.json()
}

export async function saveSector(sectorData) {
  const res = await fetch('/api/admin/sectors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sectorData)
  })
  if (!res.ok) throw new Error("Impossible de sauvegarder le secteur")
  return res.json()
}

export async function deleteSector(id) {
  const res = await fetch(`/api/admin/sectors?id=${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error("Impossible de supprimer le secteur")
  return res.json()
}
