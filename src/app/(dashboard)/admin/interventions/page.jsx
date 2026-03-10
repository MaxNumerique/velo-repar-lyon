'use client'

import { useState, useEffect } from 'react'
import { 
  Ticket, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  MapPin, 
  User, 
  Bike, 
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Loader2,
  ChevronRight,
  ExternalLink
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'
import Link from 'next/link'

const STATUS_MAP = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Terminé', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
}

import { AdminHeader } from '@/components/admin/AdminHeader'

export default function AdminInterventionsPage() {
  const [interventions, setInterventions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const fetchInterventions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
      })
      const res = await fetch(`/api/admin/interventions?${params}`)
      const data = await res.json()
      setInterventions(data)
    } catch (error) {
      console.error('Failed to fetch interventions', error)
      showToast.error('Erreur lors du chargement des interventions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInterventions()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) return
    try {
      const res = await fetch(`/api/admin/interventions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast.success('Intervention supprimée')
        fetchInterventions()
      }
    } catch (error) {
      showToast.error('Erreur lors de la suppression')
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/admin/interventions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        showToast.success('Statut mis à jour')
        fetchInterventions()
      }
    } catch (error) {
      showToast.error('Erreur lors de la mise à jour')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <AdminHeader 
          title="Gestion des Interventions"
          description="Gérez le planning et le suivi des réparations."
          icon={Ticket}
        />
        <Link href="/admin/interventions/new">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle Intervention
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Rechercher par client, adresse..." 
            className="pl-9 h-10 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px] h-10">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="IN_PROGRESS">En cours</SelectItem>
            <SelectItem value="COMPLETED">Terminé</SelectItem>
            <SelectItem value="CANCELLED">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : interventions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed rounded-2xl">
            Aucune intervention trouvée.
          </div>
        ) : (
          interventions.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-all group">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className={cn(
                    "md:w-1.5",
                    STATUS_MAP[item.status]?.color.split(' ')[0]
                  )} />
                  
                  <div className="p-4 flex-1 flex flex-col md:flex-row gap-6">
                    {/* Infos Principales */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                          STATUS_MAP[item.status]?.color
                        )}>
                          {STATUS_MAP[item.status]?.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">#{item.id.slice(-6)}</span>
                      </div>
                      
                      <div>
                        <h3 className="font-bold flex items-center gap-2 text-slate-900 truncate">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {item.clientFirstName || item.user?.firstName} {item.clientLastName || item.user?.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{item.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Planning & Tech */}
                    <div className="flex-1 space-y-3 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-3 md:pt-0">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {item.appointment ? (
                          <>
                            {new Date(item.appointment.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            <span className="text-slate-300">•</span>
                            {new Date(item.appointment.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </>
                        ) : (
                          <span className="text-slate-400 italic font-normal">Non planifié</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-[10px]">
                          {item.appointment?.technician?.user?.firstName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 font-bold uppercase leading-tight">Technicien</p>
                          <p className="font-medium truncate">
                            {item.appointment?.technician ? 
                              `${item.appointment.technician.user.firstName} ${item.appointment.technician.user.lastName}` : 
                              'En attente d\'assignation'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Vélo & Forfait */}
                    <div className="flex-1 space-y-3 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-3 md:pt-0">
                      <div className="flex items-center gap-2 text-xs">
                        <Bike className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{item.bikeModel || item.bike?.modelName || 'Vélo inconnu'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{item.bikeType || item.bike?.type?.name || 'N/A'}</span>
                      </div>
                      <div className="text-xs">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Service</p>
                        <p className="font-bold text-primary truncate">{item.servicePackage?.title || 'Réparation simple'}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 md:pl-2">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/interventions/${item.id}`} className="gap-2">
                              <Edit2 className="w-4 h-4" /> Modifier
                            </Link>
                          </DropdownMenuItem>
                          
                          <div className="h-px bg-slate-100 my-1" />
                          <p className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase">Changer statut</p>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, 'PENDING')} className="gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-400" /> En attente
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, 'IN_PROGRESS')} className="gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400" /> En cours
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, 'COMPLETED')} className="gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400" /> Terminé
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, 'CANCELLED')} className="gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400" /> Annulé
                          </DropdownMenuItem>

                          <div className="h-px bg-slate-100 my-1" />
                          <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600 gap-2 font-medium">
                            <Trash2 className="w-4 h-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
