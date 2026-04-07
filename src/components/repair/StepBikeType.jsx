import { useState, useEffect, useRef } from 'react';
import { Bike, Sparkles, ShoppingBag, Mountain, Map, Info, Camera, Search, Loader2, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

const mapBikeType = (bike) => {
  if (!bike) return "Autre";
  
  const title = (bike.title || '').toLowerCase();
  const propulsion = (bike.propulsion_type_slug || '').toLowerCase();
  const cycleType = (bike.cycle_type_slug || '').toLowerCase();

  // Électrique priority
  if (propulsion.includes('assist') || propulsion.includes('electric') || title.includes('vae') || title.includes('e-bike')) {
    return "Electrique";
  }

  // Cargo check
  if (cycleType.includes('cargo') || title.includes('cargo') || title.includes('longtail')) {
    return "Cargo";
  }

  // VTT check
  if (cycleType.includes('mountain') || cycleType.includes('vtt') || title.includes('vtt') || title.includes('rockhopper') || title.includes('stumpjumper')) {
    return "VTT";
  }

  // Route check
  if (cycleType.includes('road') || cycleType.includes('route') || title.includes('route') || title.includes('gravel') || title.includes('road')) {
    return "Route";
  }

  // Ville / VTC check 
  if (cycleType.includes('hybrid') || cycleType.includes('city') || cycleType.includes('commute') || cycleType.includes('urban') || title.includes('vtc') || title.includes('ville') || title.includes('sirrus')) {
    return "Ville";
  }

  return "Autre";
};

export function StepBikeType({ data, updateData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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

        setIsLoading(true);
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
          if (error.name !== 'AbortError') {
            console.error("Search error:", error);
          }
        } finally {
          if (!abortController.signal.aborted) {
            setIsLoading(false);
          }
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
    const bikeTitle = `${bike.title}${bike.frame_model ? ` - ${bike.frame_model}` : ''}`;
    
    const updates = {
      bikeType: mapBikeType(bike),
      bikeModel: bikeTitle
    };

    // Handle photos: remove previous Bike Index photos, keep manual ones
    const currentPhotos = data.bikePhotos || [];
    const manualPhotos = currentPhotos.filter(url => !url.includes('bikeindex.org'));
    
    if (bike.large_img) {
      updates.bikePhotos = [bike.large_img, ...manualPhotos].slice(0, 3);
    } else {
      updates.bikePhotos = manualPhotos;
    }
    
    updateData(updates);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Votre Vélo</h2>
        <p className="text-sm text-slate-500 leading-relaxed font-medium">Quel compagnon de route allons-nous chouchouter ?</p>
      </div>

      {/* Bike Index Search Bar */}
      <div className="space-y-3 relative" ref={suggestionsRef}>
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-2">
            Rechercher votre modèle
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-primary font-extrabold">Bike Index</span>
          </Label>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        </div>
        <div className="relative group transition-all duration-300">
          <Input 
            placeholder="Ex: Specialized Sirrus, Triban..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-14 pl-12 pr-4 rounded-[1.25rem] bg-white border-slate-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 shadow-sm transition-all text-slate-900 placeholder:text-slate-400 font-medium"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-primary transition-colors" />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-[60] w-full mt-3 bg-white/95 backdrop-blur-xl rounded-[1.5rem] border border-slate-100 shadow-2xl max-h-[340px] overflow-y-auto p-2 scrollbar-hide border-b-[6px] border-b-primary/10">
            {suggestions.map((bike) => (
              <button
                key={bike.id}
                type="button"
                onClick={() => handleSelectBike(bike)}
                className="w-full p-3.5 text-left hover:bg-primary/5 rounded-[1.1rem] flex items-center gap-4 transition-all duration-200 group active:scale-[0.98]"
              >
                {bike.thumb ? (
                  <img src={bike.thumb} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-md ring-1 ring-black/5" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100 shadow-inner">
                    <Bike className="w-7 h-7 text-slate-300" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-slate-900 truncate group-hover:text-primary transition-colors leading-tight">
                    {bike.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[11px] text-slate-400 font-medium truncate uppercase tracking-wider">
                      {bike.manufacturer_name} {bike.year ? `• ${bike.year}` : ''}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Manual Bike Model Input */}
      <div className="space-y-2 group transition-all duration-300">
        <Label htmlFor="bikeModel" className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Modèle du vélo</Label>
        <Input 
          id="bikeModel"
          placeholder="Ex: Rockhopper Comp 29"
          value={data.bikeModel || ''}
          onChange={(e) => updateData({ bikeModel: e.target.value })}
          className="h-14 px-5 rounded-[1.25rem] bg-white border-slate-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 shadow-sm transition-all font-bold text-slate-900"
        />
      </div>

      <div className="space-y-5 pt-4">
        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Sélectionnez un type</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {bikeTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = data.bikeType === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => updateData({ bikeType: type.id })}
                className={`relative flex flex-col items-center justify-center p-5 rounded-[1.25rem] border-2 transition-all duration-500 gap-3 group overflow-hidden ${
                  isSelected 
                    ? 'border-primary bg-white shadow-[0_8px_20px_-6px_rgba(59,130,246,0.3)]' 
                    : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-lg animate-in zoom-in duration-300">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                
                <div className={`p-3 rounded-2xl transition-all duration-500 scale-100 group-hover:scale-110 ${
                  isSelected ? 'bg-primary/10' : 'bg-slate-50 group-hover:bg-slate-100'
                }`}>
                  <Icon className={`w-8 h-8 transition-colors duration-500 ${
                    isSelected ? 'text-primary' : 'text-slate-400'
                  }`} />
                </div>
                
                <span className={`text-[13px] font-extrabold tracking-tight transition-colors duration-300 ${
                  isSelected ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'
                }`}>
                  {type.name}
                </span>
              </button>
            );
          })}
        </div>
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
