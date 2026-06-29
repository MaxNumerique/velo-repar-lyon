'use client'

import { Euro } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function InterventionCostSummary({ servicePrice = 0, selectedProducts = [], className = "" }) {
  const productsTotal = selectedProducts.reduce((sum, sp) => sum + (sp.product.price * sp.quantity), 0)
  const grandTotal = servicePrice + productsTotal

  return (
    <Card className={`bg-slate-900 text-white ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Euro className="w-4 h-4 text-primary" /> Résumé Financier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Services (Forfait)</span>
          <span>{servicePrice.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>Produits ({selectedProducts.length})</span>
          <span>{productsTotal.toFixed(2)}€</span>
        </div>
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
          <span className="font-bold uppercase tracking-wider text-[10px]">TOTAL</span>
          <div className="flex flex-col items-end">
            <span className="text-xl font-black text-primary">
              {grandTotal.toFixed(2)}€
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
