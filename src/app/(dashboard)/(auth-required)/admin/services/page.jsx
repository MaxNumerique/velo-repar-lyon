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
  Package,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { showToast } from '@/lib/notifications'
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
  DialogDescription,
} from "@/components/ui/dialog"
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'

export default function AdminServicesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Modals State (Only Delete remains)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  
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
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDelete = async () => {
    if (!itemToDelete) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/services/${itemToDelete}`, { method: 'DELETE' })
      if (res.ok) {
        showToast.service.deleted()
        setIsDeleteDialogOpen(false)
        fetchServices()
      } else {
        showToast.service.error()
      }
    } catch (error) {
      console.error('Delete failed', error)
      showToast.service.error()
    } finally {
      setIsSaving(false)
      setItemToDelete(null)
    }
  }

  const confirmDelete = (id) => {
    setItemToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <AdminHeader 
          title="Gestion des Forfaits"
          description="Gérez le catalogue des prestations et tarifs."
          icon={Tag}
        />
        <Link href="/admin/services/new">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nouveau Forfait
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Rechercher un forfait..." 
          className="pl-9 h-11 text-sm bg-white dark:bg-slate-800 border-none shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
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
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/services/${service.id}`} className="gap-2 w-full">
                        <Edit2 className="w-4 h-4" />
                        Modifier
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => confirmDelete(service.id)} className="text-red-600 gap-2">
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader className="pt-4">
            <div className="mx-auto w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
               <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-center text-xl">Supprimer ce forfait ?</DialogTitle>
            <DialogDescription className="text-center pt-2 text-slate-500 dark:text-slate-400">
              Cette action est irréversible. Toutes les données liées à cette prestation seront définitivement effacées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-3 pt-6 pb-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSaving} className="px-6 h-11 font-bold border-slate-200 dark:border-slate-800">
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving} className="px-6 h-11 font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Oui, supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
