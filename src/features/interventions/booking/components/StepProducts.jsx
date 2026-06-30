'use client'

import { useState, useEffect } from 'react';
import { Plus, Minus, Package, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getPublicProducts } from '@/features/products/services/productService';
import { useRepair } from '@/features/interventions/booking/context/RepairContext';
import { StepLoading } from './StepLoading';

export function StepProducts({ data: propData, updateData: propUpdateData }) {
  const context = useRepair(false);
  const data = context ? context.formData : propData;
  const updateData = context ? context.updateFormData : propUpdateData;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const items = await getPublicProducts();
        setProducts(items);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleToggleProduct = (product) => {
    const selectedProducts = [...(data.selectedProducts || [])];
    const index = selectedProducts.findIndex((p) => p.id === product.id);
    if (index > -1) {
      selectedProducts.splice(index, 1);
    } else {
      selectedProducts.push({ ...product, quantity: 1 });
    }
    updateData({ selectedProducts });
  };

  const handleUpdateQuantity = (productId, delta) => {
    const selectedProducts = (data.selectedProducts || []).map((p) => {
      if (p.id === productId) {
        const newQty = Math.max(1, p.quantity + delta);
        return { ...p, quantity: newQty };
      }
      return p;
    });
    updateData({ selectedProducts });
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <StepLoading message="Chargement des produits..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Produits Additionnels</h2>
        <p className="text-sm text-slate-500">Besoin de pièces ou d'accessoires ? Sélectionnez-les ici.</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Rechercher un pneu, une chaîne..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 rounded-xl h-11 border-slate-200"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredProducts.map((product) => {
          const isSelected = (data.selectedProducts || []).some((p) => p.id === product.id);
          const selectedItem = (data.selectedProducts || []).find((p) => p.id === product.id);
          return (
            <div
              key={product.id}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <div className="flex-1" onClick={() => handleToggleProduct(product)}>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900">{product.name}</h3>
                  {product.category && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 uppercase">
                      {product.category}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{product.description}</p>
                <p className="text-sm font-black text-primary mt-1">{product.price}€</p>
              </div>
              {isSelected && (
                <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-slate-100 ml-4">
                  <button
                    onClick={() => handleUpdateQuantity(product.id, -1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{selectedItem.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(product.id, 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filteredProducts.length === 0 && (
          <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Aucun produit trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
