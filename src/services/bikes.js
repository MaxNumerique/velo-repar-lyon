export async function getBikes() {
  const res = await fetch('/api/bikes')
  if (!res.ok) throw new Error("Impossible de charger les vélos")
  return res.json()
}

export async function createBike(bikeData) {
  const res = await fetch('/api/bikes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bikeData)
  })
  if (!res.ok) throw new Error("Impossible de créer le vélo")
  return res.json()
}

export async function updateBike(id, bikeData) {
  const res = await fetch(`/api/bikes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bikeData)
  })
  if (!res.ok) throw new Error("Impossible de modifier le vélo")
  return res.json()
}

export async function deleteBike(id) {
  const res = await fetch(`/api/bikes/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error("Impossible de supprimer le vélo")
  return res.json()
}

export async function searchBikes(query, options = {}) {
  const res = await fetch(`/api/bikes/search?query=${encodeURIComponent(query)}`, options)
  if (!res.ok) throw new Error("Erreur lors de la recherche du vélo")
  return res.json()
}
