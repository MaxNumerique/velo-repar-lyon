'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
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
import { Pagination } from '@/components/shared/Pagination'

const ITEMS_PER_PAGE = 10


export default function UserInterventionsPage() {
  const { user: clerkUser, isLoaded } = useUser()
  
  const role = clerkUser?.publicMetadata?.role || 'CLIENT'
  const isTechnician = role === 'TECHNICIAN'
  const isAdmin = role === 'ADMIN'
  const isClient = role === 'CLIENT'

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(isClient ? 'UPCOMING' : 'TODAY')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('DATE_ASC')
  const [userCoords, setUserCoords] = useState(null)
  const [selectedIntervention, setSelectedIntervention] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const searchParams = useSearchParams()
  const router = useRouter()
  const requestedId = searchParams.get('id')
  const scrollRef = useRef(false)

  // Set default tab based on role once loaded
  useEffect(() => {
    if (isLoaded) {
      setActiveTab(isClient ? 'UPCOMING' : 'TODAY')
      setCurrentPage(1)
    }
  }, [isLoaded, isClient])

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, sortBy])

  useEffect(() => {
    if (isLoaded && clerkUser) {
      fetchAppointments()
      // Geolocation only for technicians
      if (isTechnician && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => console.log("Geolocation error:", err)
        )
      }
    }
  }, [isLoaded, clerkUser, isTechnician])

  // Handle Deep Linking
  useEffect(() => {
    if (!loading && requestedId && appointments.length > 0 && !scrollRef.current) {
      const target = appointments.find(a => a.id === requestedId)
      if (target) {
        setActiveTab('ALL')
        setSelectedIntervention(target)
        
        // Timeout to wait for the tab change to render everything
        setTimeout(() => {
          const element = document.getElementById(`intervention-${requestedId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            scrollRef.current = true
          }
        }, 100)
      }
    }
  }, [loading, requestedId, appointments])

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
    if (!isTechnician && !isAdmin) return; // Clients cannot update status
    try {
      const res = await fetch(`/api/admin/interventions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error()
      
      setAppointments(prev => prev.map(a => a.id === id ? { 
        ...a, 
        appointment: a.appointment ? { ...a.appointment, status: newStatus } : a.appointment 
      } : a))
      
      // Also update the selected intervention so the open modal reflects the change
      setSelectedIntervention(prev => 
        prev?.id === id ? { ...prev, appointment: { ...prev.appointment, status: newStatus } } : prev
      )

      showToast.success(`Statut mis à jour : ${STATUS_CONFIG[newStatus].label}`)
      
      if (newStatus === 'COMPLETED') {
        fetchAppointments() // Refresh to handle history tab correctly
      }
    } catch (error) {
      showToast.error("Erreur lors de la mise à jour du statut")
    }
  }

  const handleCancelIntervention = async (id) => {
    try {
      const res = await fetch(`/api/interventions/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur lors de l'annulation")
      }
      
      showToast.success("Intervention annulée")
      fetchAppointments() // Refresh list
    } catch (error) {
      showToast.error(error.message)
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
      const dateToUse = appt.appointment?.scheduledAt || appt.scheduledAt || appt.createdAt
      // Use appointment status if available, fallback to request status
      const statusToUse = appt.appointment?.status
      if (!dateToUse) return false
      
      const apptDate = new Date(dateToUse)
      const todayDate = new Date()
      const isToday = apptDate.toDateString() === todayDate.toDateString()
      const isUpcoming = apptDate > todayDate && !isToday
      
      // Tab Filter
      let passTab = true
      if (activeTab === 'TODAY') {
        passTab = isToday && !['COMPLETED', 'CANCELLED'].includes(statusToUse)
      }
      else if (activeTab === 'UPCOMING') {
        // UPCOMING = future appointments not yet done
        if (isClient) {
          passTab = (isToday || isUpcoming) && !['COMPLETED', 'CANCELLED'].includes(statusToUse)
        } else {
          passTab = isUpcoming && !['COMPLETED', 'CANCELLED'].includes(statusToUse)
        }
      }
      else if (activeTab === 'HISTORY') {
        passTab = statusToUse === 'COMPLETED' || statusToUse === 'CANCELLED'
      }
      
      if (!passTab) return false

      const searchLower = searchQuery.toLowerCase()
      const clientName = `${appt.clientFirstName || ''} ${appt.clientLastName || ''} ${appt.user?.firstName || ''} ${appt.user?.lastName || ''}`.toLowerCase()
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

  const totalPages = Math.ceil(filteredAndSortedAppointments.length / ITEMS_PER_PAGE)
  const paginatedAppointments = filteredAndSortedAppointments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const clientTabs = [
    { id: 'UPCOMING', label: "Aujourd'hui & À venir" },
    { id: 'HISTORY', label: "Historique" },
    { id: 'ALL', label: "Toutes" }
  ]
  
  const techTabs = [
    { id: 'TODAY', label: "Aujourd'hui" },
    { id: 'UPCOMING', label: "À venir" },
    { id: 'HISTORY', label: "Historique" },
    { id: 'ALL', label: "Toutes" }
  ]

  const tabsToDisplay = isClient ? clientTabs : techTabs

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bike className="w-6 h-6 text-primary" /> 
            {isClient ? "Mes Demandes" : "Mes Interventions"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isClient 
              ? "Suivez l'état de vos réparations en temps réel."
              : activeTab === 'TODAY' ? "À réaliser aujourd'hui" : activeTab === 'UPCOMING' ? "Prochainement" : activeTab === 'HISTORY' ? "Historique" : "Toutes les interventions"}
          </p>
        </div>
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto w-fit">
          {tabsToDisplay.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                activeTab === tab.id ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-slate-500"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder={isClient ? "Rechercher par adresse..." : "Rechercher un client ou une adresse..."}
            className="pl-9 bg-white dark:bg-slate-800 border-none shadow-sm rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-slate-800 border-none shadow-sm rounded-xl font-medium text-slate-700 dark:text-slate-200">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-primary" />
              <SelectValue placeholder="Trier par" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DATE_ASC">Plus récent</SelectItem>
            <SelectItem value="PRICE_DESC">Prix : Décroissant</SelectItem>
            {isTechnician && userCoords && <SelectItem value="DISTANCE">Proximité (Distance)</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-slate-500">Chargement de vos données...</p>
          </div>
        ) : filteredAndSortedAppointments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-primary/40" />
            </div>
            <h3 className="text-lg font-bold">
              {isClient ? "Aucune demande trouvée" : "Aucune intervention"}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
              {searchQuery 
                ? "Aucun résultat pour votre recherche." 
                : appointments.length === 0 
                  ? (isClient ? "Vous n'avez pas encore de demande en cours." : "Aucune intervention dans le système.") 
                  : "Aucune demande dans cette catégorie."
              }
            </p>
            {isClient && !searchQuery && (
              <Button 
                onClick={() => router.push('/repair')}
                className="mt-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 h-12 cursor-pointer"
              >
                {appointments.length === 0 ? "Créer ma première demande" : "Nouvelle demande"}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {paginatedAppointments.map((appt) => (
              <div key={appt.id} id={`intervention-${appt.id}`}>
                <InterventionCard 
                  intervention={appt}
                  mode={role}
                  userCoords={userCoords}
                  onStatusUpdate={handleStatusUpdate}
                  onDelete={isClient ? handleCancelIntervention : undefined}
                  onShowDetails={setSelectedIntervention}
                  onNotifyClient={handleNotifyClient}
                />
              </div>
            ))}
            
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <InterventionDetails 
        intervention={selectedIntervention}
        open={!!selectedIntervention}
        onOpenChange={(open) => !open && setSelectedIntervention(null)}
        role={role}
      />
    </div>
  )
}
