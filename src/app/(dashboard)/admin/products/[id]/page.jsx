import { ProductForm } from '@/components/admin/ProductForm'

export const metadata = {
  title: 'Modifier Produit | Admin',
  description: 'Modifier un produit existant'
}

export default async function EditProductPage({ params }) {
  const { id } = await params
  return <ProductForm id={id} />
}
