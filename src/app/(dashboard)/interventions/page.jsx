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
import { showToast } from '@/lib/notifications'
import { cn } from '@/lib/utils'
import { InterventionDetails } from '@/components/dashboard/InterventionDetails'

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

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

  // ... handleStatusUpdate and handleNotifyClient remain the same ...

  const filteredAndSortedAppointments = appointments
    .filter(appt => {
      const dateToUse = appt.appointment?.scheduledAt || appt.scheduledAt
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

      // Search Filter
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

      {/* Advanced Filters */}
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
            {filteredAndSortedAppointments.map((appt) => {
              const distance = userCoords ? calculateDistance(userCoords.lat, userCoords.lng, appt.lat, appt.lng) : null
              
              return (
              <Card key={appt.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Left: Time & Status */}
                    <div className={cn(
                        "md:w-48 p-6 flex flex-col justify-center items-center gap-2 text-center",
                        appt.status === 'SCHEDULED' ? "bg-slate-50 dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800" :
                        appt.status === 'EN_ROUTE' ? "bg-blue-50 dark:bg-blue-900/10 border-b md:border-b-0 md:border-r border-blue-100 dark:border-blue-900/20 text-blue-600" :
                        appt.status === 'ON_SITE' ? "bg-amber-50 dark:bg-amber-900/10 border-b md:border-b-0 md:border-r border-amber-100 dark:border-amber-900/20 text-amber-600" :
                        "bg-green-50 dark:bg-green-900/10 border-b md:border-b-0 md:border-r border-green-100 dark:border-green-900/20 text-green-600"
                    )}>
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm">
                        <Clock className="w-5 h-5 mb-1 mx-auto" />
                        <span className="font-bold text-lg block leading-tight">
                          {new Date(appt.appointment?.scheduledAt || appt.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-black tracking-widest opacity-80 mt-2">
                        {appt.status}
                      </span>
                      {distance !== null && (
                        <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-500">
                          <LocateFixed className="w-3 h-3" /> {distance.toFixed(1)} km
                        </div>
                      )}
                    </div>

                    {/* Middle: Details */}
                    <div className="flex-1 p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                              {appt.servicePackage?.title || 'Maintenance'}
                            </p>
                            {appt.servicePackage?.price && (
                                <Badge variant="secondary" className="text-[10px] bg-slate-100 font-bold">{appt.servicePackage.price}€</Badge>
                            )}
                          </div>
                          <h4 className="text-xl font-bold flex items-center gap-2">
                            {appt.clientFirstName} {appt.clientLastName}
                          </h4>
                          <div className="flex items-center gap-2 text-slate-500 py-1">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium leading-tight">{appt.address}</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full bg-slate-50 hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={() => setSelectedIntervention(appt)}
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {appt.status === 'SCHEDULED' && (
                          <Button 
                            onClick={() => handleStatusUpdate(appt.id, 'EN_ROUTE')}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-bold shadow-lg shadow-blue-500/20"
                          >
                            <Navigation className="w-4 h-4" /> En route
                          </Button>
                        )}
                        
                        {appt.status === 'EN_ROUTE' && (
                          <>
                            <Button 
                                onClick={() => handleStatusUpdate(appt.id, 'ON_SITE')}
                                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-2 font-bold shadow-lg shadow-amber-500/20"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Arrivé sur place
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => handleNotifyClient(appt.id)}
                                className="border-blue-200 text-blue-600 rounded-xl gap-2 font-bold"
                            >
                                <Bell className="w-4 h-4" /> Prévenir le client
                            </Button>
                          </>
                        )}

                        {appt.status === 'ON_SITE' && (
                          <Button 
                            onClick={() => handleStatusUpdate(appt.id, 'COMPLETED')}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2 font-bold shadow-lg shadow-green-500/20"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Terminer l'intervention
                          </Button>
                        )}

                        {appt.status !== 'COMPLETED' && (
                            <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-10 w-10 text-slate-400 hover:text-slate-900 dark:hover:text-white ml-auto"
                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(appt.address)}`, '_blank')}
                            >
                                <Navigation className="w-5 h-5" />
                            </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})}
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
