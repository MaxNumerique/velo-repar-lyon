import { User, Phone, MapPin } from 'lucide-react'

export function ClientInfo({ intervention, isClient }) {
  const clientName = intervention.clientFirstName || intervention.user?.firstName;
  const clientLastName = intervention.clientLastName || intervention.user?.lastName;
  const phone = intervention.clientPhone || intervention.user?.phone;

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
        <User className="w-4 h-4" /> {isClient ? 'Mes Coordonnées' : 'Client'}
      </h3>
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-3 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <p className="font-bold text-lg">{clientName} {clientLastName}</p>
          {!isClient && phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-2 text-primary font-bold text-sm bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-colors">
              <Phone className="w-4 h-4" /> Appeler
            </a>
          )}
        </div>
        <div className="flex items-start gap-2 text-slate-500">
          <MapPin className="w-4 h-4 mt-0.5 text-primary" />
          <span className="text-sm font-medium">{intervention.address}</span>
        </div>
      </div>
    </section>
  )
}
