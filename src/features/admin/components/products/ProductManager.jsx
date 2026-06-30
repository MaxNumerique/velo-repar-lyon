'use client'

import { 
  Package as PackageIcon, 
  Plus as PlusIcon, 
  Minus, 
  Trash2 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ProductManager({ allProducts, selectedProducts, setSelectedProducts }) {
  const addProduct = (val) => {
    const prod = allProducts.find(p => p.id === val)
    if (prod && !selectedProducts.find(sp => sp.productId === val)) {
      setSelectedProducts([...selectedProducts, { productId: val, quantity: 1, product: prod }])
    }
  }
  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(sp => sp.productId !== productId))
  }

  const updateQuantity = (productId, delta) => {
    setSelectedProducts(selectedProducts.map(sp => {
      if (sp.productId === productId) {
        const newQty = sp.quantity + delta
        return { ...sp, quantity: newQty > 0 ? newQty : 1 }
      }
      return sp
    }))
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <PackageIcon className="w-4 h-4 text-primary" /> Pièces & Produits Additionnels
        </CardTitle>
        <p className="text-[11px] text-slate-500">
          Utilisez cette section pour ajouter des pièces de rechange ou accessoires à l'intervention. 
          Seuls les produits listés ici seront comptabilisés.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select onValueChange={addProduct}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Ajouter un produit..." />
            </SelectTrigger>
            <SelectContent>
              {allProducts
                .filter(p => !selectedProducts.find(sp => sp.productId === p.id))
                .map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} - {p.price}€
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          {selectedProducts.map((sp) => (
            <div key={sp.productId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex-1">
                <p className="text-sm font-medium">{sp.product.name}</p>
                <p className="text-xs text-slate-500">{sp.product.price}€ / unité</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white rounded-md border border-slate-200 px-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.preventDefault()
                      updateQuantity(sp.productId, -1)
                    }}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-bold w-4 text-center">{sp.quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.preventDefault()
                      updateQuantity(sp.productId, 1)
                    }}
                  >
                    <PlusIcon className="w-3 h-3" />
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-500"
                  onClick={(e) => {
                    e.preventDefault()
                    removeProduct(sp.productId)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {selectedProducts.length === 0 && (
            <p className="text-center py-4 text-sm text-slate-400 italic">Aucun produit additionnel</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
