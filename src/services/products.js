export async function getPublicProducts() {
  const res = await fetch('/api/products-public')
  if (!res.ok) throw new Error("Impossible de charger les produits")
  return res.json()
}

export async function getAdminProducts(params = '') {
  const res = await fetch(`/api/admin/products${params ? `?${params}` : ''}`)
  if (!res.ok) throw new Error("Impossible de charger les produits admin")
  return res.json()
}

export async function updateAdminProduct(id, productData) {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  })
  if (!res.ok) throw new Error("Impossible de modifier le produit")
  return res.json()
}
