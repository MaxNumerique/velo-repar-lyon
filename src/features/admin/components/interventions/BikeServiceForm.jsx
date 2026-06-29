import { Bike, Trash2 } from 'lucide-react'
import { AdvancedImageUpload } from '@/components/shared/AdvancedImageUpload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BIKE_TYPES } from '@/features/interventions/constants';
import { normalizeBikeType } from '@/features/interventions/services/interventionService'
import BikeSearchAutocomplete from '@/features/bikes/components/BikeSearchAutocomplete'


export default function BikeServiceForm({ formData, updateForm, packages, bikePhotos, setBikePhotos }) {
  const handleSelectBike = (bike) => {
    updateForm({
      bikeBrand: bike.manufacturer_name || '',
      bikeModel: bike.title,
      bikeType: normalizeBikeType(bike)
    })
    if (bike.large_img) {
      setBikePhotos(prev => {
        const manualImages = prev.filter(url => !url.includes('bikeindex.org'))
        return [...manualImages, bike.large_img]
      })
    }
  }
  const removeImage = (index) => {
    setBikePhotos(prev => prev.filter((_, i) => i !== index))
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
          <div className="space-y-2">
            <Label className="text-xs">
              Modèle du vélo <span className="text-destructive">*</span> (Recherche Bike Index)
            </Label>
            <BikeSearchAutocomplete
              value={formData.bikeModel || ''}
              onChangeText={val => updateForm({ bikeModel: val })}
              onSelectBike={handleSelectBike}
              placeholder="Chercher une marque ou un modèle..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Marque du vélo</Label>
            <Input
              placeholder="Ex: Trek, Specialized, Giant..."
              value={formData.bikeBrand || ''}
              onChange={e => updateForm({ bikeBrand: e.target.value })}
            />
          </div>
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
        <div className="space-y-2">
          <Label className="text-xs">Photos du vélo (optionnel)</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {bikePhotos.map((url, idx) => (
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
                  setBikePhotos(prev => [...prev, result.info.secure_url])
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
            value={formData.description || ''}
            onChange={e => updateForm({ description: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  )
}
