import { formatFullDate } from '@/lib/date-utils';
import { User, Bike, Package, MapPin, Phone, Mail, Clock } from 'lucide-react';

const SummaryItem = ({ icon: Icon, title, children, className = "", iconClassName = "text-primary" }) => (
  <div className={`p-4 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3 ${className}`}>
    <div className={`flex items-center gap-2 font-bold ${iconClassName}`}>
      <Icon className="w-4 h-4" />
      <span className="text-xs uppercase tracking-wider">{title}</span>
    </div>
    {children}
  </div>
);

export function StepValidation({ data }) {
  const totalPrice = (data.selectedProducts || []).reduce(
    (acc, p) => acc + p.price * p.quantity, 
    0
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Résumé de votre demande</h2>
        <p className="text-sm text-slate-500">Vérifiez vos informations avant de valider.</p>
      </div>

      <div className="space-y-4">
        {/* User Info */}
        <SummaryItem icon={User} title="Vos Coordonnées">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-slate-700">{data.firstName} {data.lastName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Mail className="w-3.5 h-3.5" />
              <span>{data.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Phone className="w-3.5 h-3.5" />
              <span>{data.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{data.address}</span>
            </div>
          </div>
        </SummaryItem>

        {/* Bike Info */}
        <SummaryItem icon={Bike} title="Le Vélo">
          <div>
            <p className="text-sm font-bold text-slate-700">{data.bikeType}</p>
            {data.bikeModel && (
              <p className="text-xs text-slate-500 mt-0.5">Modèle: {data.bikeModel}</p>
            )}
          </div>
        </SummaryItem>

        {/* Service */}
        {data.selectedService && (
          <SummaryItem icon={Package} title="Prestation">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">{data.selectedService.title}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                  <Clock className="w-3 h-3" />
                  {data.selectedService.duration_min} min
                </div>
              </div>
              <span className="font-bold text-primary">{data.selectedService.price}€</span>
            </div>
          </SummaryItem>
        )}

        {/* Products */}
        {data.selectedProducts && data.selectedProducts.length > 0 && (
          <SummaryItem icon={Package} title="Produits Sélectionnés">
            <div className="space-y-2">
              {data.selectedProducts.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">
                    <span className="font-bold text-slate-900">{p.quantity}x</span> {p.name}
                  </span>
                  <span className="font-semibold">{p.price * p.quantity}€</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-bold">
                <span className="text-slate-900">Total Estimation</span>
                <span className="text-primary text-lg">{totalPrice.toFixed(2)}€</span>
              </div>
            </div>
          </SummaryItem>
        )}

        {/* Appointment */}
        {data.scheduledAt && (
          <SummaryItem 
            icon={Clock} 
            title="Rendez-vous" 
            className="bg-emerald-50 border-emerald-100" 
            iconClassName="text-emerald-600"
          >
            <div className="space-y-1">
              <p className="text-sm font-bold text-emerald-900">
                {formatFullDate(data.scheduledAt)}
              </p>
              <p className="text-xs text-emerald-700 font-medium">
                À {new Date(data.scheduledAt).getHours()}h00
              </p>
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-emerald-100/50 text-[10px] font-bold text-emerald-600/70 uppercase">
                <User className="w-3 h-3" /> Technicien : {data.technicianName}
              </div>
            </div>
          </SummaryItem>
        )}
      </div>

      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
        <div className="mt-0.5">
          <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 text-[10px] font-bold">!</div>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          En validant, vous allez être redirigé vers notre plateforme de connexion sécurisée pour confirmer votre demande.
        </p>
      </div>
    </div>
  );
}
