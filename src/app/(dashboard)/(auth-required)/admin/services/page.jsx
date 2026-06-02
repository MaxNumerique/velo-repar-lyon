'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Tag, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Clock, 
  Euro,
  Package
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { showToast } from '@/lib/notifications'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal'
import { AdminToolbar } from '@/components/admin/AdminToolbar'
import { AdminHeader } from '@/components/admin/AdminHeader'

import { getAdminServices, deleteAdminService } from '@/services/repair-services'

export default function AdminServicesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [durationFilter, setDurationFilter] = useState('ALL')
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

  const fetchServices = async () => {
    setLoading(true)
    try {
      const data = await getAdminServices()
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

  const durationLabels = {
    'ALL': 'Tous',
    'EXPRESS': '< 30 min',
    'STANDARD': '30 - 60 min',
    'LONG': '> 1 heure'
  }

  const filteredServices = services.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
    
    let matchesDuration = true
    if (durationFilter === 'EXPRESS') matchesDuration = s.duration_min < 30
    else if (durationFilter === 'STANDARD') matchesDuration = s.duration_min >= 30 && s.duration_min <= 60
    else if (durationFilter === 'LONG') matchesDuration = s.duration_min > 60

    return matchesSearch && matchesDuration
  })

  const handleDelete = async () => {
    if (!itemToDelete) return
    setIsSaving(true)
    try {
      await deleteAdminService(itemToDelete)
      showToast.service.deleted()
      setIsDeleteDialogOpen(false)
      fetchServices()
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
    <div className="space-y-4 md:space-y-6">
      <AdminHeader
        title="Forfaits"
        description="Prestations et tarifs"
        icon={Tag}
        uppercase
        hideDescriptionMobile
        action={
          <Link href="/admin/services/new">
            <Button className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 h-9 md:h-10 text-xs md:text-sm px-3 md:px-5">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau Forfait</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </Link>
        }
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        filterValue={durationFilter}
        onFilterChange={setDurationFilter}
        filterOptions={durationLabels}
        filterIcon={Clock}
        filterType="duration"
        searchPlaceholder="Rechercher un forfait..."
      />

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

      <DeleteConfirmationModal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Supprimer ce forfait ?"
        description="Cette action est irréversible. Toutes les données liées à cette prestation seront définitivement effacées."
        confirmText="Oui, supprimer"
        isLoading={isSaving}
      />
    </div>
  )
}
