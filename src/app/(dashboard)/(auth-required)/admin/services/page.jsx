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
  Package
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
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from 'next/link'
import { cn } from '@/lib/utils'

import { getAdminServices, deleteAdminService } from '@/services/repair-services'

export default function AdminServicesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTool, setActiveTool] = useState(null)
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
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center">
             <Tag className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Forfaits</h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wider hidden md:block">Prestations et tarifs</p>
          </div>
        </div>
        
        <Link href="/admin/services/new">
          <Button className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 h-9 md:h-10 text-xs md:text-sm px-3 md:px-5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau Forfait</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
        </Link>
      </div>

      <div className="hidden md:flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {Object.entries(durationLabels).map(([val, label]) => (
            <button 
              key={val}
              onClick={() => setDurationFilter(val)}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                durationFilter === val 
                  ? "bg-slate-900 text-white shadow-md scale-105" 
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Rechercher un forfait..." 
            className="pl-9 h-11 bg-white dark:bg-slate-800 border-none shadow-sm rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        <div className="relative flex items-center justify-center pt-2 pb-2">
           <div className={cn(
              "flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 ease-out overflow-hidden",
              activeTool ? "w-full rounded-2xl h-12 px-3" : "w-32 rounded-full h-10 px-1"
           )}>
              {!activeTool ? (
                 <div className="flex items-center justify-around w-full">
                    <button onClick={() => setActiveTool('search')} className="p-2 text-slate-500 hover:text-primary transition-colors">
                       <Search className="w-5 h-5" />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200" />
                    <button onClick={() => setActiveTool('duration')} className="p-2 text-slate-500 hover:text-primary transition-colors relative">
                       <Clock className="w-5 h-5" />
                       {durationFilter !== 'ALL' && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-white dark:border-slate-900" />
                       )}
                    </button>
                 </div>
              ) : (
                 <div className="flex items-center w-full gap-2 animate-in fade-in zoom-in duration-200">
                    {activeTool === 'search' && (
                       <div className="flex-1 flex items-center gap-2">
                          <Search className="w-4 h-4 text-primary" />
                          <input 
                             autoFocus
                             className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400"
                             placeholder="Rechercher..."
                             value={search}
                             onChange={(e) => setSearch(e.target.value)}
                          />
                       </div>
                    )}
                    {activeTool === 'duration' && (
                       <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                          <Clock className="w-4 h-4 text-primary shrink-0" />
                          <Select value={durationFilter} onValueChange={(val) => {
                             setDurationFilter(val)
                             setActiveTool(null)
                          }}>
                             <SelectTrigger className="border-none shadow-none h-8 p-0 bg-transparent focus:ring-0 text-sm font-bold">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                                {Object.entries(durationLabels).map(([val, label]) => (
                                   <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                       </div>
                    )}
                    <button 
                       onClick={() => setActiveTool(null)}
                       className="ml-auto w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                    >
                       <span className="text-lg font-bold">×</span>
                    </button>
                 </div>
              )}
           </div>
        </div>
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
