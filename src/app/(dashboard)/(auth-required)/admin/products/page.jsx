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
import { cn } from '@/lib/utils'
import { getAdminProducts, deleteAdminProduct } from '@/services/products'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTool, setActiveTool] = useState(null)
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
      const data = await getAdminProducts(params.toString())
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
      await deleteAdminProduct(id)
      showToast.success('Produit supprimé')
      setProducts(products.filter(p => p.id !== id))
    } catch (error) {
      showToast.error(error.message || 'Une erreur est survenue')
    }
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
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center">
             <Package className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Catalogue</h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wider hidden md:block">Pièces et accessoires</p>
          </div>
        </div>
        
        <Link href="/admin/products/new">
          <Button className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 h-9 md:h-10 text-xs md:text-sm px-3 md:px-5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau Produit</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
        </Link>
      </div>

      <div className="hidden md:flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryLabels).map(([val, label]) => (
            <button 
              key={val}
              onClick={() => setCategory(val)}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                category === val 
                  ? "bg-slate-900 text-white shadow-md scale-105" 
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Rechercher un produit..." 
            className="pl-9 h-11 bg-white dark:bg-slate-800 border-none shadow-sm rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
          />
        </div>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        <div className="relative flex items-center justify-center pt-2 pb-2">
           <div className={cn(
              "flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 ease-out overflow-hidden",
              activeTool ? "w-full rounded-2xl h-12 px-3" : "w-32 rounded-full h-10 px-1"
           )}>
              {!activeTool ? (
                 <div className="flex items-center justify-around w-full">
                    <button onClick={() => setActiveTool('search')} className="p-2 text-slate-500 hover:text-primary transition-colors">
                       <Search className="w-5 h-5" />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200" />
                    <button onClick={() => setActiveTool('category')} className="p-2 text-slate-500 hover:text-primary transition-colors relative">
                       <Filter className="w-5 h-5" />
                       {category !== 'ALL' && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-white dark:border-slate-900" />
                       )}
                    </button>
                 </div>
              ) : (
                 <div className="flex items-center w-full gap-2 animate-in fade-in zoom-in duration-200">
                    {activeTool === 'search' && (
                       <div className="flex-1 flex items-center gap-2">
                          <Search className="w-4 h-4 text-primary" />
                          <input 
                             autoFocus
                             className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400"
                             placeholder="Nom du produit..."
                             value={search}
                             onChange={(e) => setSearch(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && (fetchProducts(), setActiveTool(null))}
                          />
                       </div>
                    )}
                    {activeTool === 'category' && (
                       <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                          <Filter className="w-4 h-4 text-primary shrink-0" />
                          <Select value={category} onValueChange={(val) => {
                             setCategory(val)
                             setActiveTool(null)
                          }}>
                             <SelectTrigger className="border-none shadow-none h-8 p-0 bg-transparent focus:ring-0 text-sm font-bold">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                                {Object.entries(categoryLabels).map(([val, label]) => (
                                   <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                       </div>
                    )}
                    <button 
                       onClick={() => setActiveTool(null)}
                       className="ml-auto w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                    >
                       <span className="text-lg font-bold">×</span>
                    </button>
                 </div>
              )}
           </div>
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
