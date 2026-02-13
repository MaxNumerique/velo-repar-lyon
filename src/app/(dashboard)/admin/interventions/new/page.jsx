'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CldUploadWidget } from 'next-cloudinary'
import AddressAutocomplete from '@/components/admin/AddressAutocomplete'
import { 
  Ticket, 
  MapPin, 
  User, 
  Bike, 
  Calendar as CalendarIcon, 
  Loader2, 
  ChevronLeft, 
  CheckCircle2,
  Image as ImageIcon,
  X,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { showToast } from '@/lib/notifications'

const BIK_TYPES = ["VTT", "VTC", "VAE", "ROUTE", "VILLE"]

export default function NewInterventionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState([])
  const [images, setImages] = useState([])
  const [assignedTech, setAssignedTech] = useState(null)
  
  const [formData, setFormData] = useState({
    clientFirstName: '',
    clientLastName: '',
    clientPhone: '',
    address: '',
    lat: null,
    lng: null,
    bikeModel: '',
    bikeType: '',
    servicePackageId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00'
  })

  useEffect(() => {
    fetch('/api/admin/services')
      .then(res => res.json())
      .then(data => setPackages(data))
      .catch(err => console.error("Erreur chargement services:", err))
  }, [])

  const updateForm = (updates) => setFormData(prev => ({ ...prev, ...updates }))

  const handleLocationSelect = async ({ address, lat, lng }) => {
    updateForm({ address, lat, lng })
    setAssignedTech(null) // Reset while fetching
    
    try {
      const res = await fetch(`/api/admin/interventions/assign-technician?lat=${lat}&lng=${lng}`)
      if (res.ok) {
        const data = await res.json()
        setAssignedTech(data)
      } else {
        showToast.error("Pas de technicien disponible pour ce secteur")
      }
    } catch (error) {
       console.error("Assign tech error:", error)
    }
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.time) {
      showToast.error("Veuillez choisir une heure")
      return
    }

    setLoading(true)
    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}`).toISOString()
      const res = await fetch('/api/admin/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          scheduledAt,
          images,
          technicianId: assignedTech?.id
        })
      })

      if (res.ok) {
        showToast.success('Intervention créée avec succès')
        router.push('/admin/interventions')
      } else {
        const err = await res.json()
        showToast.error(err.error || 'Une erreur est survenue')
      }
    } catch (error) {
      showToast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const selectedPackage = packages.find(p => p.id === formData.servicePackageId)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/interventions">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Nouvelle Intervention</h1>
          <p className="text-xs text-slate-500">Planifiez une nouvelle réparation à domicile.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Section Client */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Informations Client
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Prénom</Label>
                <Input 
                  required 
                  placeholder="Jean"
                  value={formData.clientFirstName}
                  onChange={e => updateForm({ clientFirstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Nom</Label>
                <Input 
                  required 
                  placeholder="Dupont"
                  value={formData.clientLastName}
                  onChange={e => updateForm({ clientLastName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Téléphone</Label>
                <Input 
                  required 
                  placeholder="06 12 34 56 78"
                  value={formData.clientPhone}
                  onChange={e => updateForm({ clientPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs">Adresse d'intervention (Lyon et environs)</Label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(val) => updateForm({ address: val })}
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section Vélo & Photos */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bike className="w-4 h-4 text-primary" /> Informations Vélo & Photos
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
                        <X className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                  <CldUploadWidget 
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET} 
                    options={{
                      maxFiles: 5,
                      styles: {
                        palette: {
                          window: "#FFFFFF",
                          windowBorder: "#90A0B3",
                          tabIcon: "#22C55E",
                          menuIcons: "#5A616A",
                          textDark: "#000000",
                          textLight: "#FFFFFF",
                          link: "#22C55E",
                          action: "#22C55E",
                          inactiveTabIcon: "#0E2F5A",
                          error: "#F43F5E",
                          inProgress: "#22C55E",
                          complete: "#20B832",
                          sourceBg: "#E4EBF1"
                        }
                      }
                    }}
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
        </div>

        {/* Colonne de droite : Planification & Récap */}
        <div className="space-y-6">
          <Card className="bg-slate-50 border-dashed">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" /> Planification
              </CardTitle>
              <CardDescription className="text-[11px]">
                Le technicien sera assigné automatiquement selon le secteur de l'adresse.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Date souhaitée</Label>
                <Input 
                  type="date" 
                  value={formData.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => updateForm({ date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-400">Heure</Label>
                  <Select 
                    value={formData.time?.split(':')[0] || ""} 
                    onValueChange={(h) => {
                      const m = formData.time?.split(':')[1] || "00";
                      updateForm({ time: `${h}:${m}` });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => i + 9).map(h => (
                        <SelectItem key={h} value={h.toString().padStart(2, '0')}>
                          {h}h
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-400">Minutes</Label>
                  <Select 
                    value={formData.time?.split(':')[1] || ""} 
                    onValueChange={(m) => {
                      const h = formData.time?.split(':')[0] || "09";
                      updateForm({ time: `${h}:${m}` });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="mm" />
                    </SelectTrigger>
                    <SelectContent>
                      {["00", "15", "30", "45"].map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1">
                Les horaires d'intervention sont de 09h00 à 19h00.
              </p>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full gap-2 font-bold shadow-lg shadow-primary/20" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Créer l'intervention
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/1 border-primary/20">
            <CardHeader className="py-3">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-primary">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3 pb-4">
              <div className="flex justify-between gap-5">
                <span className="text-slate-500">Forfait</span>
                <span className="font-bold">{selectedPackage?.title || '-'}</span>
              </div>
              <div className="flex justify-between gap-5">
                <span className="text-slate-500">Durée estimée</span>
                <span className="font-bold">{selectedPackage?.duration_min || '-'} min</span>
              </div>
              <div className="flex justify-between gap-5">
                <span className="text-slate-500">Technicien</span>
                <span className="font-bold text-primary">
                  {assignedTech ? assignedTech.name : "-"}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-slate-500 font-medium text-sm">Prix total</span>
                <span className="font-bold text-primary text-lg">{selectedPackage?.price || 0} €</span>
              </div>
              <p className="text-[10px] text-slate-400 text-center italic mt-2">
                L'assignation est faite automatiquement en fonction du secteur.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
