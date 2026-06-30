import { useState } from 'react';
import { Bike, Loader2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BIKE_TYPES } from '@/features/interventions/constants';
import { normalizeBikeType } from '@/features/interventions/services/interventionService';
import { AdvancedImageUpload } from '@/components/shared/AdvancedImageUpload';
import BikeSearchAutocomplete from '@/features/bikes/components/BikeSearchAutocomplete';

export default function BikeForm({ initialData = {}, onSubmit, onCancel, isLoading: isSubmitting }) {
  const [formData, setFormData] = useState({
    brand: '',
    modelName: '',
    type: 'Ville',
    imageUrl: '',
    photos: [],
    notes: '',
    ...initialData
  });

  const handleSelectBike = (bike) => {
    setFormData(prev => ({
      ...prev,
      brand: bike.manufacturer_name || '',
      modelName: bike.title,
      type: normalizeBikeType(bike),
      imageUrl: bike.large_img || prev.imageUrl,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Rechercher un modèle (Bike Index)
            </Label>
            <BikeSearchAutocomplete
              onSelectBike={handleSelectBike}
              placeholder="Ex: Specialized Sirrus, Triban..."
              inputClassName="h-12 pl-10 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
              iconPosition="left"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500">Marque *</Label>
              <Input 
                required
                value={formData.brand}
                onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="Ex: Trek"
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500">Modèle</Label>
              <Input 
                value={formData.modelName}
                onChange={e => setFormData(prev => ({ ...prev, modelName: e.target.value }))}
                placeholder="Ex: FX 3 Disc"
                className="rounded-xl h-12"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500">Type de vélo</Label>
            <Select value={formData.type} onValueChange={v => setFormData(prev => ({ ...prev, type: v }))}>
              <SelectTrigger className="rounded-xl h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BIKE_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Photo de la monture</Label>
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-6">
              {formData.imageUrl ? (
                <div className="relative w-full sm:w-48 aspect-video sm:aspect-square rounded-[2rem] overflow-hidden border-4 border-white shadow-xl group">
                    <img src={formData.imageUrl} alt="Vélo" className="w-full h-full object-cover" />
                    <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="w-8 h-8 text-white" />
                    </button>
                </div>
              ) : (
                <AdvancedImageUpload 
                    onSuccess={(res) => setFormData(prev => ({ ...prev, imageUrl: res.info.secure_url }))}
                    className="w-full sm:w-48 aspect-video sm:aspect-square rounded-[2rem] border-2 border-dashed border-slate-200"
                />
              )}
              <div className="flex-1 space-y-2">
                <p className="text-sm text-slate-600 font-medium">Capturez votre vélo sous son meilleur angle.</p>
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  Une photo permet au technicien d'identifier instantanément votre vélo à son arrivée.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes & Particularités</Label>
            <Textarea 
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Ex: Porte-bagage installé, freins à disque hydrauliques, pneus anti-crevaison..."
              className="rounded-2xl min-h-[160px] bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 resize-none p-4"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-8 border-t border-slate-100">
        <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            className="rounded-xl h-12 px-8 font-bold text-slate-500 hover:bg-slate-50"
        >
          Annuler
        </Button>
        <Button 
            type="submit" 
            disabled={isSubmitting || !formData.brand}
            className="rounded-xl h-12 px-10 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : initialData?.id ? "Mettre à jour" : "Enregistrer le vélo"}
        </Button>
      </div>
    </form>
  );
}
