import { useState, useEffect, useRef } from 'react'
import { Bike, Plus, Trash2, Search, Loader2 } from 'lucide-react'
import { CldUploadWidget } from 'next-cloudinary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const BIK_TYPES = ["VTT", "VTC", "VAE", "ROUTE", "VILLE"]

const mapBikeType = (bikeType) => {
  if (!bikeType) return "VILLE"
  const type = bikeType.toLowerCase()
  if (type.includes('mountain') || type.includes('vtt')) return "VTT"
  if (type.includes('road') || type.includes('route')) return "ROUTE"
  if (type.includes('hybrid') || type.includes('vtc')) return "VTC"
  if (type.includes('electric') || type.includes('vae') || type.includes('e-bike')) return "VAE"
  return "VILLE"
}

export default function BikeServiceForm({ formData, updateForm, packages, images, setImages }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef(null)

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
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsLoading(true)
        try {
          const res = await fetch(`/api/bikes/search?query=${encodeURIComponent(searchQuery)}`)
          const data = await res.json()
          setSuggestions(data.bikes || [])
          setShowSuggestions(true)
        } catch (error) {
          console.error("Search error:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSelectBike = (bike) => {
    updateForm({
      bikeModel: bike.title,
      bikeType: mapBikeType(bike.type_of_cycle)
    })
    
    if (bike.large_img) {
      setImages(prev => {
        if (!prev.includes(bike.large_img)) {
          return [...prev, bike.large_img]
        }
        return prev
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
            <Label className="text-xs">Modèle du vélo (Recherche Bike Index)</Label>
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
            <Label className="text-xs">Type de vélo</Label>
            <Select value={formData.bikeType} onValueChange={val => updateForm({ bikeType: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                {BIK_TYPES.map(type => (
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
            <CldUploadWidget 
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET} 
              onSuccess={(result) => {
                if (result.info?.secure_url) {
                  setImages(prev => [...prev, result.info.secure_url])
                }
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="aspect-square flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-md text-slate-400 hover:text-primary hover:border-primary transition-colors hover:bg-slate-50"
                >
                  <Plus size={20} />
                  <span className="text-[10px]">Ajouter</span>
                </button>
              )}
            </CldUploadWidget>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Forfait sélectionné</Label>
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
