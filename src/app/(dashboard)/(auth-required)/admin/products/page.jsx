'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Filter,
  Image as ImageIcon,
  CheckCircle2,
  XCircle
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { showToast } from '@/lib/notifications'
import { Badge } from '@/components/ui/badge'
import { getAdminProducts, deleteAdminProduct } from '@/features/products/services/productService'
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { AdminHeader } from '@/features/admin/components/AdminHeader'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [category])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category,
        ...(search ? { search } : {})
      })
      const data = await getAdminProducts(params.toString())
      setProducts(data)
    } catch (error) {
      console.error(error)
      showToast.error("Erreur lors du chargement des produits")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!productToDelete) return
    setIsDeleting(true)
    try {
      await deleteAdminProduct(productToDelete.id)
      showToast.success('Produit supprimé')
      setProducts(products.filter(p => p.id !== productToDelete.id))
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch (error) {
      showToast.error(error.message || 'Une erreur est survenue')
    } finally {
      setIsDeleting(false)
    }
  }

  const confirmDelete = (product) => {
    setProductToDelete(product)
    setIsDeleteDialogOpen(true)
  }

  const categoryLabels = {
    'ALL': 'Tous',
    'Pièces': 'Pièces',
    'Accessoires': 'Accessoires',
    'Consommables': 'Consommables',
    'Autre': 'Autre'
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <AdminHeader
        title="Catalogue"
        description="Pièces et accessoires"
        icon={Package}
        uppercase
        hideDescriptionMobile
        action={
          <Link href="/admin/products/new">
            <Button className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 h-9 md:h-10 text-xs md:text-sm px-3 md:px-5">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau Produit</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </Link>
        }
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        filterValue={category}
        onFilterChange={setCategory}
        filterOptions={categoryLabels}
        filterIcon={Filter}
        filterType="category"
        searchPlaceholder="Rechercher un produit..."
        onSearchSubmit={fetchProducts}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Chargement des produits...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center p-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Aucun produit trouvé</h3>
          <p className="text-slate-500">Commencez par ajouter votre premier produit.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all bg-white">
              <div className="aspect-video bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <ImageIcon className="w-10 h-10 text-slate-300" />
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={product.isActive ? "success" : "secondary"} className="gap-1 shadow-sm">
                    {product.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {product.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                {product.category && (
                  <Badge className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white border-none">
                    {product.category}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900">{product.name}</h3>
                  <span className="text-lg font-black text-primary">{product.price}€</span>
                </div>
                {product.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                    {product.description}
                  </p>
                )}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Link href={`/admin/products/${product.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      <Edit className="w-3 h-3" /> Modifier
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => confirmDelete(product)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <DeleteConfirmationModal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Supprimer le produit ?"
        description={
          <>
            Êtes-vous sûr de vouloir supprimer le produit <strong>{productToDelete?.name}</strong> ? Cette action est irréversible.
          </>
        }
        confirmText="Oui, supprimer"
        isLoading={isDeleting}
      />
    </div>
  )
}
