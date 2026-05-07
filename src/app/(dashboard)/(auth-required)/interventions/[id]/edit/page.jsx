'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  Loader2, 
  ChevronLeft, 
  Save, 
  MapPin, 
  Bike, 
  FileText, 
  Sparkles, 
  ShoppingBag, 
  Mountain, 
  Map, 
  Info, 
  Camera,
  User,
  Phone,
  Mail,
  Calendar,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { showToast } from '@/lib/notifications'
import { canModifyIntervention } from '@/lib/date-utils'
import AddressAutocomplete from '@/components/admin/AddressAutocomplete'
import { MultiImageUpload } from '@/components/shared/MultiImageUpload'
import { StepServices } from '@/components/repair/StepServices'
import StepScheduling from '@/components/repair/StepScheduling'

const bikeTypes = [
  { id: 'VTT', name: 'VTT', icon: Mountain },
  { id: 'Route', name: 'Vélo de Route', icon: Map },
  { id: 'Ville', name: 'Vélo de Ville', icon: Bike },
  { id: 'Electrique', name: 'Électrique (VAE)', icon: Sparkles },
  { id: 'Cargo', name: 'Vélo Cargo', icon: ShoppingBag },
  { id: 'Autre', name: 'Autre', icon: Bike },
];

export default function ClientEditInterventionPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [intervention, setIntervention] = useState(null)
  
  const [formData, setFormData] = useState({
    description: '',
    address: '',
    bikeModel: '',
    bikeType: '',
    clientFirstName: '',
    clientLastName: '',
    clientPhone: '',
    email: '',
    bikePhotos: [],
    issuePhotos: [],
    servicePackageId: '',
    scheduledAt: '',
    technicianId: '',
    technicianName: '',
  })

  useEffect(() => {
    fetchIntervention()
  }, [id])

  const fetchIntervention = async () => {
    try {
      const res = await fetch(`/api/interventions/${id}`) 
      if (!res.ok) throw new Error("Erreur lors du chargement")
      const data = await res.json()
      
      // Check if it's modifiable
      if (!canModifyIntervention(data.scheduledAt)) {
        showToast.error("Modification impossible moins de 6h avant l'intervention")
        router.push('/interventions')
        return
      }

      setIntervention(data)
      setFormData({
        description: data.description || '',
        address: data.address || '',
        bikeModel: data.bikeDetails?.model || data.bike?.modelName || '',
        bikeType: data.bikeDetails?.type || data.bike?.type || '',
        clientFirstName: data.clientFirstName || data.user?.firstName || '',
        clientLastName: data.clientLastName || data.user?.lastName || '',
        clientPhone: data.clientPhone || data.user?.phone || '',
        email: data.user?.email || '',
        bikePhotos: data.bikePhotos || [],
        issuePhotos: data.issuePhotos || [],
        servicePackageId: data.servicePackageId || '',
        scheduledAt: data.scheduledAt || '',
        technicianId: data.technicianId || '',
        technicianName: data.technician?.firstName || '',
      })
    } catch (error) {
      showToast.error("Impossible de charger l'intervention")
      router.push('/interventions')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/interventions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        showToast.success('Intervention mise à jour')
        router.push('/interventions')
      } else {
        const error = await res.json()
        showToast.error(error.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      showToast.error('Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  // Derived values after hooks
  const displayId = typeof id === 'string' ? id.slice(-6) : '';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Chargement de votre demande...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full bg-white shadow-sm ring-1 ring-slate-200"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Modifier ma demande</h1>
          <p className="text-slate-500 text-sm">#{displayId} - {formData.address}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* User Info Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm ring-1 ring-slate-200 space-y-6">
          <div className="flex items-center gap-2 text-primary">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-slate-900">Vos Informations <span className="text-destructive">*</span></h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientFirstName">Prénom <span className="text-destructive">*</span></Label>
              <Input
                id="clientFirstName"
                value={formData.clientFirstName}
                onChange={(e) => updateFormData({ clientFirstName: e.target.value})}
                placeholder="Jean"
                className="rounded-xl h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientLastName">Nom <span className="text-destructive">*</span></Label>
              <Input
                id="clientLastName"
                value={formData.clientLastName}
                onChange={(e) => updateFormData({ clientLastName: e.target.value})}
                placeholder="Dupont"
                className="rounded-xl h-12"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Adresse mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="rounded-xl h-12 pl-10 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientPhone">N° Téléphone <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="clientPhone"
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => updateFormData({ clientPhone: e.target.value})}
                placeholder="06 12 34 56 78"
                className="rounded-xl h-12 pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse de la réparation <span className="text-destructive">*</span></Label>
            <AddressAutocomplete
              value={formData.address}
              onChange={(address) => updateFormData({ address })}
              placeholder="123 rue de la République, Lyon"
            />
          </div>
        </div>

        {/* Bike Details Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm ring-1 ring-slate-200 space-y-8">
          <div className="flex items-center gap-2 text-primary">
            <Bike className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-slate-900">Votre Vélo <span className="text-destructive">*</span></h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {bikeTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.bikeType === type.id;
              
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => updateFormData({ bikeType: type.id})}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-2 ${
                    isSelected 
                      ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'animate-bounce-short' : ''}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{type.name}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2 pt-4">
            <Label htmlFor="bikeModel" className="font-bold">Modèle du vélo (optionnel)</Label>
            <Input 
              id="bikeModel"
              value={formData.bikeModel}
              onChange={(e) => updateFormData({ bikeModel: e.target.value})}
              placeholder="Ex: Rockrider 520..."
              className="rounded-xl h-12"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-primary">
              <Camera className="w-5 h-5" />
              <h2 className="text-sm font-bold text-slate-900">Photos de votre vélo</h2>
            </div>
            <MultiImageUpload 
              value={formData.bikePhotos}
              onChange={(urls) => updateFormData({ bikePhotos: urls })}
              label="Mon Vélo"
              maxImages={3}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-primary">
              <Camera className="w-5 h-5" />
              <h2 className="text-sm font-bold text-slate-900">Photos de la panne</h2>
            </div>
            <MultiImageUpload 
              value={formData.issuePhotos}
              onChange={(urls) => updateFormData({ issuePhotos: urls })}
              label="La Panne"
              maxImages={3}
            />
          </div>
        </div>

        {/* Prestation Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm ring-1 ring-slate-200">
          <StepServices data={formData} updateData={updateFormData} />
        </div>

        {/* Scheduling Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm ring-1 ring-slate-200">
          <StepScheduling formData={formData} onUpdate={updateFormData} />
        </div>

        {/* Description Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm ring-1 ring-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-slate-900">Que se passe-t-il ?</h2>
          </div>
          <Textarea 
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value})}
            placeholder="Décrivez précisément votre problème (bruit suspect, crevaison, freins qui ne fonctionnent plus...)"
            className="rounded-2xl min-h-[120px] bg-white border-slate-200 focus:ring-primary/20"
          />
        </div>
        
        <p className="text-[10px] text-slate-400 text-center">
          * Les champs marqués d'un astérisque sont obligatoires.
        </p>

        <div className="pt-4 sticky bottom-6 z-20">
          <Button 
            type="submit" 
            disabled={saving}
            className="w-full h-14 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 gap-2"
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  )
}
