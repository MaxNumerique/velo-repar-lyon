'use client'

import { Bike, Package, Clock, ShoppingCart, User, CheckCircle2 } from 'lucide-react';
import { formatFullDate } from '@/lib/date-utils';

export function RepairSummarySide({ data }) {
  const servicePrice = data.selectedService?.price || 0;
  const productsPrice = (data.selectedProducts || []).reduce(
    (acc, p) => acc + p.price * p.quantity, 
    0
  );
  const totalPrice = servicePrice + productsPrice;

  const hasBike = data.bikeType || data.bikeModel;
  const hasService = data.selectedService;
  const hasProducts = data.selectedProducts?.length > 0;
  const hasSchedule = data.scheduledAt;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 ring-1 ring-slate-200/20 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full -ml-12 -mb-12 blur-2xl" />

        <div className="relative space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-50">
            <h3 className="text-xl font-black text-slate-900 tracking-tight text-center">Estimation</h3>
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">En direct</span>
          </div>

          <div className="space-y-5">
            {/* Section: Vélo */}
            <div className={`space-y-2 transition-all duration-500 ${hasBike ? 'opacity-100' : 'opacity-40'}`}>
              <div className="flex items-center gap-2 text-slate-400">
                <Bike className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Le Vélo</span>
              </div>
              {hasBike ? (
                <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                  <p className="text-sm font-extrabold text-slate-900 leading-tight">
                    {data.bikeModel || data.bikeType}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">Type : {data.bikeType || 'Non spécifié'}</p>
                </div>
              ) : (
                <p className="text-[11px] italic text-slate-400">En attente de sélection...</p>
              )}
            </div>

            {/* Section: Prestation */}
            <div className={`space-y-2 transition-all duration-500 ${hasService ? 'opacity-100' : 'opacity-40'}`}>
              <div className="flex items-center gap-2 text-slate-400">
                <Package className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Prestation</span>
              </div>
              {hasService ? (
                <div className="flex justify-between items-start animate-in fade-in slide-in-from-left-2 duration-500">
                  <p className="text-sm font-extrabold text-slate-900 flex-1 pr-4">{data.selectedService.title}</p>
                  <span className="font-black text-slate-900 text-sm whitespace-nowrap">{data.selectedService.price}€</span>
                </div>
              ) : (
                <p className="text-[11px] italic text-slate-400">En attente de sélection...</p>
              )}
            </div>

            {/* Section: Produits */}
            {hasProducts && (
              <div className="space-y-2 animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-2 text-slate-400">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pièces & Accessoires</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {data.selectedProducts.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-600 font-medium">{p.quantity}x {p.name}</span>
                      <span className="text-slate-900 font-bold">{p.price * p.quantity}€</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Rendez-vous */}
            <div className={`space-y-2 transition-all duration-500 ${hasSchedule ? 'opacity-100' : 'opacity-40'}`}>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Rendez-vous</span>
              </div>
              {hasSchedule ? (
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 animate-in flip-in-x-0 duration-500">
                  <p className="text-[13px] font-black text-emerald-700 leading-tight">
                    {formatFullDate(data.scheduledAt)}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 tracking-wide">
                    {new Date(data.scheduledAt).getHours()}h00 • Technicien assigné
                  </p>
                </div>
              ) : (
                <p className="text-[11px] italic text-slate-400">En attente de planification...</p>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total</p>
                <p className="text-3xl font-black text-primary leading-none tabular-nums tracking-tighter">
                  {totalPrice.toFixed(2)}<span className="text-xl ml-0.5">€</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 font-bold italic leading-tight">Estimation finale</p>
                <p className="text-[9px] text-slate-400 font-bold italic leading-tight">hors imprévus</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasService && (
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-3 animate-in fade-in zoom-in duration-700">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          <p className="text-[11px] text-primary/80 font-medium leading-relaxed">
            Votre demande est éligible à notre garantie <span className="font-black">Réparé ou Remboursé</span>.
          </p>
        </div>
      )}
    </div>
  );
}
