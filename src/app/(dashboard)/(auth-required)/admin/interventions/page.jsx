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
  ExternalLink,
  X,
  ArrowUpDown
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
  const [sortBy, setSortBy] = useState('DATE_ASC')
  const [activeTool, setActiveTool] = useState(null)
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
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center">
             <Ticket className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Interventions</h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wider hidden md:block">
               {activeTab === 'TODAY' ? "À réaliser aujourd'hui" : activeTab === 'UPCOMING' ? "Prochainement" : activeTab === 'HISTORY' ? "Historique" : "Toutes les interventions"}
            </p>
          </div>
        </div>
        
        <Link href="/admin/interventions/new">
          <Button className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 h-9 md:h-10 text-xs md:text-sm px-3 md:px-5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
        </Link>
      </div>

      {/* Desktop Filter Bar (Standard & Clean) */}
      <div className="hidden md:flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Rechercher par client, adresse..." 
            className="pl-9 h-11 bg-transparent border-none focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pr-2">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-[180px] h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-semibold">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Période" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              <SelectItem value="ALL">Toutes les interventions</SelectItem>
              <SelectItem value="TODAY">Aujourd'hui</SelectItem>
              <SelectItem value="UPCOMING">À venir</SelectItem>
              <SelectItem value="HISTORY">Historique</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-semibold">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Tous les statuts" />
              </div>
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

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-semibold">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Trier par" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              <SelectItem value="DATE_ASC">Plus récent</SelectItem>
              <SelectItem value="DATE_DESC">Plus ancien</SelectItem>
              <SelectItem value="STATUS">Par statut</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Filter Bar (Integrated & Clean) */}
      <div className="md:hidden w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-12 flex items-center overflow-hidden transition-all duration-300">
        {!activeTool ? (
          <div className="flex w-full h-full divide-x divide-slate-100 dark:divide-slate-700">
            <button 
              onClick={() => setActiveTool('search')}
              className="flex-1 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveTool('period')}
              className="flex-1 flex items-center justify-center text-slate-400 hover:text-primary transition-colors relative"
            >
              <Calendar className="w-5 h-5" />
              {activeTab !== 'ALL' && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-white dark:border-slate-800" />
              )}
            </button>
            <button 
              onClick={() => setActiveTool('status')}
              className="flex-1 flex items-center justify-center text-slate-400 hover:text-primary transition-colors relative"
            >
              <Filter className="w-5 h-5" />
              {statusFilter !== 'ALL' && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-white dark:border-slate-900" />
              )}
            </button>
            <button 
              onClick={() => setActiveTool('sort')}
              className="flex-1 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex w-full h-full items-center px-1 animate-in slide-in-from-right-2 duration-300">
            <div className="flex-1 h-full flex items-center min-w-0">
              {activeTool === 'search' && (
                <div className="flex items-center w-full pl-3">
                  <Search className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <input 
                    autoFocus
                    placeholder="Rechercher..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm font-semibold text-slate-700 dark:text-slate-200"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              )}

              {activeTool === 'period' && (
                <Select value={activeTab} onValueChange={(val) => {
                  setActiveTab(val)
                  setActiveTool(null)
                }}>
                  <SelectTrigger className="w-full border-none bg-transparent h-full shadow-none focus:ring-0 px-4 font-bold text-sm text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <SelectValue placeholder="Période" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="ALL">Toutes</SelectItem>
                    <SelectItem value="TODAY">Aujourd'hui</SelectItem>
                    <SelectItem value="UPCOMING">À venir</SelectItem>
                    <SelectItem value="HISTORY">Historique</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {activeTool === 'status' && (
                <Select value={statusFilter} onValueChange={(val) => {
                  setStatusFilter(val)
                  setActiveTool(null)
                }}>
                  <SelectTrigger className="w-full border-none bg-transparent h-full shadow-none focus:ring-0 px-4 font-bold text-sm text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-primary" />
                      <SelectValue placeholder="Statut" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="ALL">Tous les statuts</SelectItem>
                    <SelectItem value="SCHEDULED">Programmé</SelectItem>
                    <SelectItem value="EN_ROUTE">En route</SelectItem>
                    <SelectItem value="ON_SITE">Sur place</SelectItem>
                    <SelectItem value="COMPLETED">Terminé</SelectItem>
                    <SelectItem value="CANCELLED">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {activeTool === 'sort' && (
                <Select value={sortBy} onValueChange={(val) => {
                  setSortBy(val)
                  setActiveTool(null)
                }}>
                  <SelectTrigger className="w-full border-none bg-transparent h-full shadow-none focus:ring-0 px-4 font-bold text-sm text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-primary" />
                      <SelectValue placeholder="Trier par" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="DATE_ASC">Plus récent</SelectItem>
                    <SelectItem value="DATE_DESC">Plus ancien</SelectItem>
                    <SelectItem value="STATUS">Par statut</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <button 
              onClick={() => setActiveTool(null)}
              className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
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
                const dateToUse = item.appointment?.scheduledAt
                const statusToUse = item.appointment?.status
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
              .sort((a, b) => {
                if (sortBy === 'DATE_ASC') {
                  return new Date(b.appointment?.scheduledAt || 0) - new Date(a.appointment?.scheduledAt || 0)
                }
                if (sortBy === 'DATE_DESC') {
                  return new Date(a.appointment?.scheduledAt || 0) - new Date(b.appointment?.scheduledAt || 0)
                }
                if (sortBy === 'STATUS') {
                  return (a.appointment?.status || '').localeCompare(b.appointment?.status || '')
                }
                return 0
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
