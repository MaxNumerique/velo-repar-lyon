'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Loader2, 
  Image as ImageIcon,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { showToast } from '@/lib/notifications'
import { Badge } from '@/components/ui/badge'

import { AdminHeader } from '@/components/admin/AdminHeader'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')

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
      const res = await fetch(`/api/admin/products?${params}`)
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      showToast.error("Erreur lors du chargement des produits")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        showToast.success('Produit supprimé')
        setProducts(products.filter(p => p.id !== id))
      } else {
        const data = await res.json()
        showToast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      showToast.error('Une erreur est survenue')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <AdminHeader 
          title="Gestion des Produits"
          description="Gérez les pièces et accessoires pour vos interventions"
          icon={Package}
        />
        <Link href="/admin/products/new">
          <Button className="gap-2 shadow-lg">
            <Plus className="w-4 h-4" /> Nouveau Produit
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Rechercher un produit..."
                className="pl-9 h-11 text-sm bg-white dark:bg-slate-800 border-none shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              />
            </div>
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full md:w-[200px] h-11 bg-white dark:bg-slate-800 border-none shadow-sm rounded-xl px-4">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="ALL">Toutes catégories</SelectItem>
                  <SelectItem value="Pièces">Pièces</SelectItem>
                  <SelectItem value="Accessoires">Accessoires</SelectItem>
                  <SelectItem value="Consommables">Consommables</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
