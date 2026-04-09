import { useState, useEffect, useRef } from 'react'
import { Bike, Plus, Trash2, Search, Loader2 } from 'lucide-react'
import { AdvancedImageUpload } from '@/components/shared/AdvancedImageUpload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BIKE_TYPES, normalizeBikeType } from '@/lib/intervention-utils'


export default function BikeServiceForm({ formData, updateForm, packages, images, setImages }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef(null)
  const cacheRef = useRef({})
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const abortController = new AbortController()
    
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        if (cacheRef.current[searchQuery]) {
          setSuggestions(cacheRef.current[searchQuery])
          setShowSuggestions(true)
          return
        }

        setIsLoading(true)
        try {
          const res = await fetch(`/api/bikes/search?query=${encodeURIComponent(searchQuery)}`, {
            signal: abortController.signal
          })
          const data = await res.json()
          
          if (!abortController.signal.aborted) {
            const bikes = data.bikes || []
            cacheRef.current[searchQuery] = bikes
            setSuggestions(bikes)
            setShowSuggestions(true)
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error("Search error:", error)
          }
        } finally {
          if (!abortController.signal.aborted) {
            setIsLoading(false)
          }
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      abortController.abort()
    }
  }, [searchQuery])

  const handleSelectBike = (bike) => {
    updateForm({
      bikeModel: bike.title,
      bikeType: normalizeBikeType(bike)
    })
    
    if (bike.large_img) {
      setImages(prev => {
        const manualImages = prev.filter(url => !url.includes('bikeindex.org'))
        return [...manualImages, bike.large_img]
      })
    }
    
    setSearchQuery('')
    setShowSuggestions(false)
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bike className="w-4 h-4 text-primary" /> Informations Vélo & Forfait
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 relative" ref={suggestionsRef}>
            <Label className="text-xs">
              Modèle du vélo <span className="text-destructive">*</span> {isLoading ? '(Recherche en cours...)' : '(Recherche Bike Index)'}
            </Label>
            <div className="relative">
              <Input 
                placeholder="Chercher une marque ou un modèle..."
                value={searchQuery || formData.bikeModel}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  updateForm({ bikeModel: e.target.value })
                }}
                className="pr-8"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((bike) => (
                  <button
                    key={bike.id}
                    type="button"
                    onClick={() => handleSelectBike(bike)}
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 border-b border-slate-100 last:border-0"
                  >
                    {bike.thumb ? (
                      <img src={bike.thumb} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Bike className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{bike.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {bike.manufacturer_name} {bike.frame_model} {bike.year ? `(${bike.year})` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Type de vélo <span className="text-destructive">*</span></Label>
            <Select value={formData.bikeType || undefined} onValueChange={val => updateForm({ bikeType: val })}>
              <SelectTrigger>
                <SelectValue placeholder="VTT, VAE, ..." />
              </SelectTrigger>
              <SelectContent>
                {BIKE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Photos du vélo (optionnel)</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {images.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-md overflow-hidden border group">
                <img src={url} alt="Vélo" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>
            ))}
            <AdvancedImageUpload 
              onSuccess={(result) => {
                if (result.info?.secure_url) {
                  setImages(prev => [...prev, result.info.secure_url])
                }
              }}
              multiple={true}
              className="aspect-square"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Forfait sélectionné <span className="text-destructive">*</span></Label>
          <Select 
            value={formData.servicePackageId} 
            onValueChange={val => updateForm({ servicePackageId: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un forfait" />
            </SelectTrigger>
            <SelectContent>
              {packages.map(pkg => (
                <SelectItem key={pkg.id} value={pkg.id}>
                  {pkg.title} - {pkg.price}€
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Détails complémentaires</Label>
          <Textarea 
            placeholder="Précisez les réparations à effectuer ou l'état du vélo..."
            className="min-h-[100px]"
            value={formData.description}
            onChange={e => updateForm({ description: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  )
}
