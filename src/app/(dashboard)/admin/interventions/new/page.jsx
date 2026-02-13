'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { showToast } from '@/lib/notifications'
import Link from 'next/link'

export default function NewInterventionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const [formData, setFormData] = useState({
    clientFirstName: '',
    clientLastName: '',
    clientPhone: '',
    address: '',
    bikeModel: '',
    bikeType: '',
    servicePackageId: '',
    description: '',
    scheduledAt: '',
    technicianId: ''
  })

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/admin/services')
      const data = await res.json()
      setPackages(data)
    } catch (error) {
       console.error("Fetch packages error:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        showToast.success('Intervention créée avec succès')
        router.push('/admin/interventions')
      } else {
        const data = await res.json()
        showToast.error(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      showToast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

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
                  onChange={e => setFormData({...formData, clientFirstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Nom</Label>
                <Input 
                  required 
                  placeholder="Dupont"
                  value={formData.clientLastName}
                  onChange={e => setFormData({...formData, clientLastName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Téléphone</Label>
                <Input 
                  required 
                  placeholder="06 12 34 56 78"
                  value={formData.clientPhone}
                  onChange={e => setFormData({...formData, clientPhone: e.target.value})}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs">Adresse d'intervention (Lyon et environs)</Label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(val) => setFormData({...formData, address: val})}
                  onLocationSelect={({ address, lat, lng }) => {
                    setFormData({
                      ...formData,
                      address,
                      lat,
                      lng
                    })
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bike className="w-4 h-4 text-primary" /> Informations Vélo
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Modèle du vélo</Label>
                <Input 
                  placeholder="ex: Rockrider ST 520"
                  value={formData.bikeModel}
                  onChange={e => setFormData({...formData, bikeModel: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Type de vélo</Label>
                <Select value={formData.bikeType} onValueChange={val => setFormData({...formData, bikeType: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VTT">VTT</SelectItem>
                    <SelectItem value="VTC">VTC</SelectItem>
                    <SelectItem value="VAE">VAE (Électrique)</SelectItem>
                    <SelectItem value="ROUTE">Route</SelectItem>
                    <SelectItem value="VILLE">Ville</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs">Description du problème / Forfait</Label>
                <Select 
                  value={formData.servicePackageId} 
                  onValueChange={val => setFormData({...formData, servicePackageId: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un forfait" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map(pkg => (
                      <SelectItem key={pkg.id} value={pkg.id}>{pkg.title} - {pkg.price}€</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs">Détails complémentaires</Label>
                <Textarea 
                  placeholder="Précisez les réparations à effectuer..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-50 border-dashed">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" /> Planification
              </CardTitle>
              <CardDescription className="text-[11px]">
                Le technicien sera assigné automatiquement selon le secteur de l'adresse renseignée.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Date souhaitée</Label>
                <Input 
                  type="date" 
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Créneaux disponibles</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-[10px] h-10 font-bold"
                    onClick={() => {
                        // In a real app we'd need the tech ID first.
                        // For the admin flow, we can either:
                        // 1. Force the admin to pick a tech (easer)
                        // 2. Mock a "find tech" call first.
                        // Let's assume the admin just wants to see ANY valid slot for the sector.
                        // For simplicity, let's just use a select with fixed times or 
                        // add a "Search Slots" button that triggers a geocode + sector check.
                        showToast.info("L'assignation se fait dynamiquement à la validation.")
                    }}
                  >
                    Vérifier dispos
                  </Button>
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Heure (ex: 09:30)</Label>
                  <Input 
                    required
                    placeholder="HH:MM"
                    onChange={e => {
                        if (e.target.value.length === 5) {
                            const [h, m] = e.target.value.split(':')
                            const date = new Date(selectedDate)
                            date.setHours(h, m, 0, 0)
                            setFormData({...formData, scheduledAt: date.toISOString()})
                        }
                    }}
                  />
                </div>
              </div>

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

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="py-3">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-primary">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 pb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Service</span>
                <span className="font-bold">{packages.find(p => p.id === formData.servicePackageId)?.title || 'Standard'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Prix approx.</span>
                <span className="font-bold text-primary">{packages.find(p => p.id === formData.servicePackageId)?.price || 0} €</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
