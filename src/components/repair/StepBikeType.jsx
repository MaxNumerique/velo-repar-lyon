import { Bike, Sparkles, ShoppingBag, Mountain, Map } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const bikeTypes = [
  { id: 'VTT', name: 'VTT', icon: Mountain },
  { id: 'Route', name: 'Vélo de Route', icon: Map },
  { id: 'Ville', name: 'Vélo de Ville', icon: Bike },
  { id: 'Electrique', name: 'Électrique (VAE)', icon: Sparkles },
  { id: 'Cargo', name: 'Vélo Cargo', icon: ShoppingBag },
  { id: 'Autre', name: 'Autre', icon: Bike },
];

export function StepBikeType({ data, updateData }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Votre Vélo</h2>
        <p className="text-sm text-slate-500">Quel type de vélo devons-nous réparer ?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {bikeTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = data.bikeType === type.id;
          
          return (
            <button
              key={type.id}
              onClick={() => updateData({ bikeType: type.id })}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 gap-3 ${
                isSelected 
                  ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                  : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-8 h-8 ${isSelected ? 'animate-bounce-short' : ''}`} />
              <span className="text-sm font-bold">{type.name}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-100">
        <Label htmlFor="bikeModel" className="text-slate-900 font-bold">Modèle précis (optionnel)</Label>
        <Input
          id="bikeModel"
          value={data.bikeModel || ''}
          onChange={(e) => updateData({ bikeModel: e.target.value })}
          placeholder="Ex: Specialized Sirrus 2.0, Decathlon Rockrider..."
          className="rounded-xl h-12"
        />
        <p className="text-[10px] text-slate-400 italic">Pour que le technicien puisse mieux se préparer.</p>
      </div>
    </div>
  );
}
