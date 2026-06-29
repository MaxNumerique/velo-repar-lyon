import { ProductForm } from '@/features/admin/components/products/ProductForm'

export const metadata = {
  title: 'Nouveau Produit | Admin',
  description: 'Ajouter un nouveau produit au catalogue'
}

export default function NewProductPage() {
  return <ProductForm />
}
