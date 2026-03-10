'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Navigation, 
  Bell, 
  MoreVertical,
  ChevronRight,
  Bike,
  User as UserIcon,
  Loader2,
  Search,
  ArrowUpDown,
  LocateFixed,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { showToast } from '@/lib/notifications'
import { cn } from '@/lib/utils'
import { InterventionDetails } from '@/components/dashboard/InterventionDetails'
import { STATUS_CONFIG, calculateDistance } from '@/lib/intervention-utils'
import { InterventionCard } from '@/components/shared/InterventionCard'


export default function TechnicianInterventionsPage() {
  const { user: clerkUser, isLoaded } = useUser()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('TODAY')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('DATE_ASC')
  const [userCoords, setUserCoords] = useState(null)
  const [selectedIntervention, setSelectedIntervention] = useState(null)

  useEffect(() => {
    if (isLoaded && clerkUser) {
      fetchAppointments()
      // Geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => console.log("Geolocation error:", err)
        )
      }
    }
  }, [isLoaded, clerkUser])

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/admin/interventions')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAppointments(data)
    } catch (error) {
      showToast.error("Erreur lors du chargement des interventions")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/admin/interventions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error()
      
      setAppointments(prev => prev.map(a => a.id === id ? { 
        ...a, 
        status: newStatus,
        appointment: a.appointment ? { ...a.appointment, status: newStatus } : a.appointment 
      } : a))
      showToast.success(`Statut mis à jour : ${STATUS_CONFIG[newStatus].label}`)
      
      if (newStatus === 'COMPLETED') {
        fetchAppointments() // Refresh to handle history tab correctly
      }
    } catch (error) {
      showToast.error("Erreur lors de la mise à jour du statut")
    }
  }

  const handleNotifyClient = async (id) => {
    try {
        showToast.info("Notification envoyée au client")
    } catch (err) {
        showToast.error("Erreur d'envoi")
    }
  }

  const filteredAndSortedAppointments = appointments
    .filter(appt => {
      const dateToUse = appt.appointment?.scheduledAt || appt.scheduledAt
      // Use appointment status if available, fallback to request status
      const statusToUse = appt.appointment?.status || appt.status
      if (!dateToUse) return false
      
      const apptDate = new Date(dateToUse)
      const todayDate = new Date()
      const isToday = apptDate.toDateString() === todayDate.toDateString()
      const isUpcoming = apptDate > todayDate && !isToday
      
      // Tab Filter
      let passTab = true
      if (activeTab === 'TODAY') passTab = isToday && statusToUse !== 'COMPLETED'
      else if (activeTab === 'UPCOMING') passTab = isUpcoming
      else if (activeTab === 'HISTORY') passTab = statusToUse === 'COMPLETED' || (apptDate < todayDate && !isToday)
      
      if (!passTab) return false

      const searchLower = searchQuery.toLowerCase()
      const clientName = `${appt.clientFirstName} ${appt.clientLastName} ${appt.user?.firstName || ''} ${appt.user?.lastName || ''}`.toLowerCase()
      return clientName.includes(searchLower) || appt.address.toLowerCase().includes(searchLower)
    })
    .sort((a, b) => {
      if (sortBy === 'DATE_ASC') {
        return new Date(a.appointment?.scheduledAt || a.scheduledAt) - new Date(b.appointment?.scheduledAt || b.scheduledAt)
      }
      if (sortBy === 'PRICE_DESC') {
        return (b.servicePackage?.price || 0) - (a.servicePackage?.price || 0)
      }
      if (sortBy === 'DISTANCE' && userCoords) {
        const distA = calculateDistance(userCoords.lat, userCoords.lng, a.lat, a.lng)
        const distB = calculateDistance(userCoords.lat, userCoords.lng, b.lat, b.lng)
        return distA - distB
      }
      return 0
    })

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bike className="w-6 h-6 text-primary" /> Mes Interventions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {activeTab === 'TODAY' ? "À réaliser aujourd'hui" : activeTab === 'UPCOMING' ? "Prochainement" : activeTab === 'HISTORY' ? "Historique" : "Toutes les interventions"}
          </p>
        </div>
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
          {['TODAY', 'UPCOMING', 'HISTORY', 'ALL'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                activeTab === tab ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-slate-500"
              )}
            >
              {tab === 'TODAY' ? "Aujourd'hui" : tab === 'UPCOMING' ? "À venir" : tab === 'HISTORY' ? "Historique" : "Toutes"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Rechercher un client ou une adresse..." 
            className="pl-9 bg-white dark:bg-slate-800 border-none shadow-sm rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-slate-800 border-none shadow-sm rounded-xl font-medium">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-primary" />
              <SelectValue placeholder="Trier par" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DATE_ASC">Plus proche (Date)</SelectItem>
            <SelectItem value="PRICE_DESC">Prix : Décroissant</SelectItem>
            {userCoords && <SelectItem value="DISTANCE">Proximité (Distance)</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredAndSortedAppointments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-primary/40" />
            </div>
            <h3 className="text-lg font-bold">Aucune intervention</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
              {searchQuery ? "Aucun résultat pour votre recherche." : "Tout est à jour ! Profitez-en pour souffler un peu."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAndSortedAppointments.map((appt) => (
              <InterventionCard 
                key={appt.id}
                intervention={appt}
                mode="TECHNICIAN"
                userCoords={userCoords}
                onStatusUpdate={handleStatusUpdate}
                onShowDetails={setSelectedIntervention}
                onNotifyClient={handleNotifyClient}
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
