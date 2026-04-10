import { useState, useEffect, useRef } from 'react';
import { Bike, Search, Loader2, Check, Info, Camera, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BIKE_TYPES, normalizeBikeType } from '@/lib/intervention-utils';
import { AdvancedImageUpload } from '@/components/shared/AdvancedImageUpload';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const cacheRef = useRef({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        if (cacheRef.current[searchQuery]) {
          setSuggestions(cacheRef.current[searchQuery]);
          setShowSuggestions(true);
          return;
        }

        setIsSearching(true);
        try {
          const res = await fetch(`/api/bikes/search?query=${encodeURIComponent(searchQuery)}`, {
            signal: abortController.signal
          });
          const result = await res.json();
          if (!abortController.signal.aborted) {
            const bikes = result.bikes || [];
            cacheRef.current[searchQuery] = bikes;
            setSuggestions(bikes);
            setShowSuggestions(true);
          }
        } catch (error) {
          if (error.name !== 'AbortError') console.error("Search error:", error);
        } finally {
          if (!abortController.signal.aborted) setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery]);

  const handleSelectBike = (bike) => {
    setFormData(prev => ({
      ...prev,
      brand: bike.manufacturer_name || '',
      modelName: bike.title,
      type: normalizeBikeType(bike),
      imageUrl: bike.large_img || prev.imageUrl,
    }));
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left Column: Core Info */}
        <div className="space-y-6">
          <div className="space-y-3 relative" ref={suggestionsRef}>
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Rechercher un modèle (Bike Index)
              </Label>
              {isSearching && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </div>
            <div className="relative group">
              <Input 
                placeholder="Ex: Specialized Sirrus, Triban..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-12 pl-10 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-60 overflow-y-auto p-2">
                {suggestions.map((bike) => (
                  <button
                    key={bike.id}
                    type="button"
                    onClick={() => handleSelectBike(bike)}
                    className="w-full p-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-3 transition-colors group"
                  >
                    {bike.thumb ? (
                      <img src={bike.thumb} alt="" className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center border">
                        <Bike className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-primary">{bike.title}</p>
                      <p className="text-[10px] text-slate-400 truncate uppercase">{bike.manufacturer_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
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

        {/* Right Column: Media & Notes */}
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
