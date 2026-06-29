import { Bike, CheckCircle2 } from 'lucide-react'

export function BikeServiceInfo({ intervention }) {
  const bikeName = `${intervention.bike?.brand || intervention.bikeDetails?.brand || ''} ${intervention.bike?.modelName || intervention.bikeDetails?.model || ''}`.trim() || 'Vélo';
  const bikeType = intervention.bike?.type || intervention.bikeDetails?.type;
  const service = intervention.servicePackage;

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
        <Bike className="w-4 h-4" /> Vélo & Service
      </h3>
      <div className="space-y-3">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 underline decoration-primary/30 underline-offset-4">Vélo</p>
            <p className="font-bold text-slate-900 dark:text-white">
              {bikeName} 
              {bikeType && (
                <span className="text-slate-400 font-medium ml-2 text-sm italic">
                  ({bikeType})
                </span>
              )}
            </p>
          </div>
          <Bike className="w-8 h-8 text-primary/20" />
        </div>
        
        <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl border border-primary/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <p className="text-[10px] text-primary/60 font-bold uppercase mb-1 tracking-widest">Forfait sélectionné</p>
          <p className="font-black text-xl text-primary">{service?.title || 'Réparation simple'}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{service?.description}</p>
          {service?.price && (
              <div className="mt-4 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Prix :</span>
                  <p className="font-black text-2xl text-slate-900 dark:text-white">{service.price}€</p>
              </div>
          )}
        </div>
      </div>
    </section>
  )
}
