'use client'

import { Bike, ImageIcon, X, Plus, Trash2 } from 'lucide-react'
import { CldUploadWidget } from 'next-cloudinary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const BIK_TYPES = ["VTT", "VTC", "VAE", "ROUTE", "VILLE"]

export default function BikeServiceForm({ formData, updateForm, packages, images, setImages }) {
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
          <div className="space-y-2">
            <Label className="text-xs">Modèle du vélo</Label>
            <Input 
              placeholder="ex: Rockrider ST 520"
              value={formData.bikeModel}
              onChange={e => updateForm({ bikeModel: e.target.value })}
            />
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
