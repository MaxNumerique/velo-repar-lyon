'use client'

import { useState, useEffect } from 'react';
import { Loader2, Check, Euro, Clock, Package, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StepProducts } from './StepProducts';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function StepServices({ data, updateData }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProducts, setShowProducts] = useState(data.selectedProducts?.length > 0);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services-public');
        const items = await res.json();
        setServices(items);
      } catch (error) {
        console.error('Failed to fetch services', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleSelectService = (service) => {
    updateData({ 
      servicePackageId: service.id,
      selectedService: service // Store full service for summary
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Chargement des forfaits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Prestation souhaitée</h2>
        <p className="text-sm text-slate-500">Choisissez le forfait qui correspond le mieux à votre besoin.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {services.map((service) => {
          const isSelected = data.servicePackageId === service.id;

          return (
            <button
              key={service.id}
              onClick={() => handleSelectService(service)}
              className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all duration-300 gap-2 ${
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900">{service.title}</h3>
                  {isSelected && (
                    <Badge className="bg-primary text-white border-none py-0 px-2 h-4 text-[10px]">
                      SÉLECTIONNÉ
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-black text-primary">{service.price}€</span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <Clock className="w-3 h-3" />
                    {service.duration_min} min
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {service.description}
              </p>
            </button>
          );
        })}
      </div>
      <div className="pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-4 transition-all hover:bg-slate-100/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Ajouter des produits ?</p>
              <p className="text-xs text-slate-500">Pneus, chaînes, accessoires...</p>
            </div>
          </div>
          <Switch 
            id="show-products"
            checked={showProducts}
            onCheckedChange={(checked) => {
              setShowProducts(checked);
              if (!checked) {
                updateData({ selectedProducts: [] });
              }
            }}
          />
        </div>

        {showProducts && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <StepProducts data={data} updateData={updateData} />
          </div>
        )}
      </div>
    </div>
  );
}
