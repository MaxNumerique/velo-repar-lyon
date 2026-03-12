import { Bike, Sparkles, ShoppingBag, Mountain, Map, Info, Camera } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiImageUpload } from '@/components/shared/MultiImageUpload';

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

      <div className="space-y-4 pt-6 mt-6 border-t border-slate-100">
        <div className="flex items-center gap-2 text-slate-900 mb-1">
          <Info className="w-5 h-5 text-primary" />
          <Label htmlFor="description" className="font-bold text-base">Que se passe-t-il ?</Label>
        </div>
        <Textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => updateData({ description: e.target.value })}
          placeholder="Décrivez précisément votre problème (bruit suspect, crevaison, freins qui ne fonctionnent plus...)"
          className="rounded-2xl min-h-[120px] bg-white border-slate-200 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-800"
        />
      </div>

      <div className="space-y-6 pt-6 mt-6 border-t border-slate-100">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Camera className="w-5 h-5 text-primary" />
            <span className="font-bold text-base">Photos de votre vélo</span>
          </div>
          <MultiImageUpload 
            value={data.bikePhotos || []}
            onChange={(urls) => updateData({ bikePhotos: urls })}
            label="Mon Vélo"
            maxImages={3}
          />
          <p className="text-[10px] text-slate-400 italic">Des photos générales du vélo aident le technicien à identifier le type exact de pièces nécessaires.</p>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Camera className="w-5 h-5 text-primary" />
            <span className="font-bold text-base">Photos de la panne</span>
          </div>
          <MultiImageUpload 
            value={data.issuePhotos || []}
            onChange={(urls) => updateData({ issuePhotos: urls })}
            label="La Panne"
            maxImages={3}
          />
          <p className="text-[10px] text-slate-400 italic">Prenez en photo la zone précise du problème (dérailleur, pneu, étrier de frein...).</p>
        </div>
      </div>
    </div>
  );
}
