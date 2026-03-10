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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { showToast } from '@/lib/notifications'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { InterventionCard } from '@/components/shared/InterventionCard'
import { InterventionDetails } from '@/components/dashboard/InterventionDetails'

import { AdminHeader } from '@/components/admin/AdminHeader'

export default function AdminInterventionsPage() {
  const [interventions, setInterventions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedIntervention, setSelectedIntervention] = useState(null)

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <AdminHeader 
          title="Gestion des Interventions"
          description="Gérez le planning et le suivi des réparations."
          icon={Ticket}
        />
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
            {['TODAY', 'UPCOMING', 'HISTORY', 'ALL'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                  activeTab === tab ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-slate-500"
                )}
              >
                {tab === 'TODAY' ? "Aujourd'hui" : tab === 'UPCOMING' ? "À venir" : tab === 'HISTORY' ? "Historique" : "Toutes"}
              </button>
            ))}
          </div>

          <Link href="/admin/interventions/new">
            <Button size="sm" className="gap-2 h-10 px-6 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle Intervention</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Rechercher par client, adresse..." 
            className="pl-9 h-11 text-sm bg-white dark:bg-slate-800 border-none shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px] h-11 bg-white dark:bg-slate-800 border-none shadow-sm rounded-xl px-4">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-2xl">
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            <SelectItem value="SCHEDULED">Programmé</SelectItem>
            <SelectItem value="EN_ROUTE">En route</SelectItem>
            <SelectItem value="ON_SITE">Sur place</SelectItem>
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
          <div className="grid grid-cols-1 gap-4">
            {interventions
              .filter(item => {
                const dateToUse = item.appointment?.scheduledAt || item.scheduledAt
                const statusToUse = item.appointment?.status || item.status
                if (!dateToUse) return activeTab === 'ALL'
                
                const apptDate = new Date(dateToUse)
                const todayDate = new Date()
                const isToday = apptDate.toDateString() === todayDate.toDateString()
                const isUpcoming = apptDate > todayDate && !isToday
                
                if (activeTab === 'TODAY') return isToday && statusToUse !== 'COMPLETED'
                if (activeTab === 'UPCOMING') return isUpcoming
                if (activeTab === 'HISTORY') return statusToUse === 'COMPLETED' || (apptDate < todayDate && !isToday)
                return true
              })
              .map((item) => (
                <InterventionCard 
                  key={item.id}
                  intervention={item}
                  mode="ADMIN"
                  onStatusUpdate={handleUpdateStatus}
                  onDelete={handleDelete}
                  onShowDetails={setSelectedIntervention}
                />
              ))}
          </div>
        )}
      </div>

      <InterventionDetails 
        intervention={selectedIntervention} 
        open={!!selectedIntervention} 
        onOpenChange={(open) => !open && setSelectedIntervention(null)} 
      />
    </div>
  )
}
