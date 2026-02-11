'use client'

import { useState, useEffect } from 'react'
import { 
  Tag, 
  Search, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Clock, 
  Euro,
  Loader2,
  Package
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function AdminServicesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState(null)

  // Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration_min: '',
    image: ''
  })

  const fetchServices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/services')
      const data = await res.json()
      setServices(data)
    } catch (error) {
      console.error('Failed to fetch services', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const filteredServices = services.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Erreur lors de la création')
      setIsCreateOpen(false)
      setFormData({ title: '', description: '', price: '', duration_min: '', image: '' })
      fetchServices()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/services/${selectedService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Erreur lors de la mise à jour')
      setIsEditOpen(false)
      fetchServices()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce forfait ?')) return
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      if (res.ok) fetchServices()
    } catch (error) {
      console.error('Delete failed', error)
    }
  }

  const openEdit = (service) => {
    setSelectedService(service)
    setFormData({
      title: service.title,
      description: service.description,
      price: service.price.toString(),
      duration_min: service.duration_min.toString(),
      image: service.image || ''
    })
    setIsEditOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Gestion des Forfaits
          </h1>
          <p className="text-xs text-slate-500 mt-1">Gérez le catalogue des prestations et tarifs.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => {
          setFormData({ title: '', description: '', price: '', duration_min: '', image: '' })
          setIsCreateOpen(true)
        }}>
          <Plus className="w-4 h-4" />
          Nouveau Forfait
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Rechercher un forfait..." 
          className="pl-9 h-10 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400">Chargement...</div>
        ) : filteredServices.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 border border-dashed rounded-2xl">
            Aucun forfait trouvé.
          </div>
        ) : (
          filteredServices.map((service) => (
            <Card key={service.id} className="overflow-hidden hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800 flex flex-row md:flex-col relative">
              {/* Dropdown: top-right of card */}
              <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-6 w-6 md:h-7 md:w-7 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                      <MoreVertical className="w-3 h-3 md:w-4 md:h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(service)} className="gap-2">
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(service.id)} className="text-red-600 gap-2">
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Thumbnail */}
              <div className="w-24 h-24 md:w-full md:h-auto md:aspect-video relative bg-slate-100 dark:bg-slate-900 border-r md:border-r-0 md:border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                {service.image ? (
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <Package className="w-6 h-6 md:w-8 md:h-8 text-primary/30" />
                  </div>
                )}
              </div>
              
              <CardContent className="p-3 md:p-4 flex-1 flex flex-col justify-center pr-8 md:pr-4">
                <div className="flex justify-between items-start gap-2 mb-1 md:mb-2">
                  <h3 className="font-bold text-sm line-clamp-1">{service.title}</h3>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-primary whitespace-nowrap">
                    <Euro className="w-3 h-3" />
                    {service.price}
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 md:line-clamp-2 md:mb-4 md:min-h-[2.5rem]">
                  {service.description}
                </p>
                
                <div className="hidden md:block mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                    <Clock className="w-3 h-3 text-primary/60" />
                    {service.duration_min} minutes
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(val) => {
        if (!val) {
          setIsCreateOpen(false)
          setIsEditOpen(false)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {isCreateOpen ? 'Créer un forfait' : 'Modifier le forfait'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={isCreateOpen ? handleCreate : handleUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs">Titre</Label>
              <Input 
                required 
                placeholder="Ex: Révision standard" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Textarea 
                required 
                placeholder="Détails de la prestation..." 
                className="h-24 resize-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Prix (€)</Label>
                <Input 
                  required 
                  type="number" 
                  placeholder="69" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Durée (min)</Label>
                <Input 
                  required 
                  type="number" 
                  placeholder="60" 
                  value={formData.duration_min}
                  onChange={(e) => setFormData({...formData, duration_min: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Lien Image (Optionnel)</Label>
              <Input 
                placeholder="https://..." 
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
              />
            </div>
            
            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => {
                setIsCreateOpen(false)
                setIsEditOpen(false)
              }} disabled={isSaving}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCreateOpen ? 'Créer' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
