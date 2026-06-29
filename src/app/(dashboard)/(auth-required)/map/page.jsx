'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { 
  Loader2, 
  Navigation, 
  Map as MapIcon, 
  Clock, 
  Bike, 
  MapPin, 
  ChevronRight, 
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { showToast } from '@/lib/notifications'
import { cn } from '@/lib/utils'
import { geocodeAddress } from '@/lib/googleMaps'
import { STATUS_CONFIG } from '@/features/interventions/constants'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useRouter } from 'next/navigation'
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal'
import { getAdminInterventions, updateAdminIntervention } from '@/features/interventions/services/interventionService'

const LYON_BOUNDS = [[4.70, 45.65], [4.95, 45.85]]

export default function TechnicianMapPage() {
  const router = useRouter()
  const { user: clerkUser, isLoaded } = useUser()
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markers = useRef([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [mapStyle, setMapStyle] = useState('streets-v2')
  const [userCoords, setUserCoords] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [apptToCancel, setApptToCancel] = useState(null)
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY

  const handleStatusUpdate = async (id, newStatus) => {
    const isTerminal = ['COMPLETED', 'CANCELLED'].includes(newStatus)
    setUpdatingStatus(true)
    
    if (isTerminal) {
      setAppointments(prev => prev.filter(a => a.id !== id))
      setSelectedAppt(null)
    } else {
      setAppointments(prev => prev.map(a => 
        a.id === id ? { ...a, status: newStatus } : a
      ))
      setSelectedAppt(prev => 
        prev?.id === id ? { ...prev, status: newStatus } : prev
      )
    }
    try {
      await updateAdminIntervention(id, { status: newStatus })
      
      showToast.success(`Statut mis à jour : ${STATUS_CONFIG[newStatus]?.label}`)
      
      await fetchAppointments()
    } catch (error) {
      showToast.error("Erreur lors de la mise à jour du statut")
      await fetchAppointments()
    } finally {
      setUpdatingStatus(false)
      setIsCancelOpen(false)
      setApptToCancel(null)
    }
  }
  useEffect(() => {
    if (isLoaded && clerkUser) {
      fetchAppointments()
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => console.log("Geo error:", err)
        )
      }
    }
  }, [isLoaded, clerkUser])

  useEffect(() => {
    if (map.current && maptilerKey) {
        map.current.setStyle(`https://api.maptiler.com/maps/${mapStyle}/style.json?key=${maptilerKey}`)
    }
  }, [mapStyle, maptilerKey])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const data = await getAdminInterventions()
      const todayString = new Date().toDateString()
      const todayAppts = data.filter(appt => {
        const dateToUse = appt.scheduledAt
        if (!dateToUse) return false
        const currentStatus = appt.status
        if (['COMPLETED', 'CANCELLED'].includes(currentStatus)) return false
        return new Date(dateToUse).toDateString() === todayString
      })
      const processedAppts = await Promise.all(
        todayAppts.map(async (appt) => {
          if (appt.lat && appt.lng) return appt;
          const coords = await geocodeAddress(appt.address);
          if (coords) return { ...appt, lat: coords.lat, lng: coords.lng };
          return appt;
        })
      );
      const validAppts = processedAppts.filter(appt => appt.lat && appt.lng)
      setAppointments(validAppts)
    } catch (error) {
      showToast.error("Erreur lors du chargement des interventions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!mapContainer.current || map.current) return
    const initialStyle = maptilerKey 
      ? `https://api.maptiler.com/maps/${mapStyle}/style.json?key=${maptilerKey}`
      : 'https://demotiles.maplibre.org/style.json'
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle,
      center: [4.8357, 45.7640],
      zoom: 12,
      maxBounds: LYON_BOUNDS,
      trackResize: true
    })
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.on('load', () => {
        setMapLoaded(true)
    })
    return () => {
      markers.current.forEach(m => m.remove())
      map.current?.remove()
      map.current = null
    }
  }, [])

  const updateMarkers = () => {
    if (!map.current || !mapLoaded) return
    markers.current.forEach(m => m.remove())
    markers.current = []
    if (appointments.length > 0) {
        appointments.forEach((appt) => {
            const el = document.createElement('div')
            el.className = 'group relative cursor-pointer'
            el.innerHTML = `
              <div class="w-10 h-10 bg-primary rounded-2xl border-4 border-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
            `
            el.addEventListener('click', () => {
                setSelectedAppt(appt)
                map.current.flyTo({
                    center: [appt.lng, appt.lat],
                    zoom: 15,
                    padding: { bottom: 200 }
                })
            })
            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([appt.lng, appt.lat])
                .addTo(map.current)
            
            markers.current.push(marker)
        })
        if (appointments.length > 1) {
            const bounds = new maplibregl.LngLatBounds()
            appointments.forEach(appt => bounds.extend([appt.lng, appt.lat]))
            map.current.fitBounds(bounds, { padding: { top: 100, bottom: 250, left: 50, right: 50 }, maxZoom: 15 })
        } else if (appointments.length === 1) {
            map.current.flyTo({ center: [appointments[0].lng, appointments[0].lat], zoom: 14 })
        }
    }
  }

  useEffect(() => {
    if (mapLoaded) updateMarkers()
  }, [mapLoaded, appointments])

  return (
    <div className="relative h-[calc(100vh-64px)] md:h-[calc(100vh-100px)] w-[calc(100%+2rem)] md:w-full -mx-4 md:mx-0 -mt-4 md:mt-0 overflow-hidden rounded-none md:rounded-3xl shadow-none md:shadow-2xl border-none md:border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      {(!isLoaded || !mapLoaded) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-50 transition-opacity">
          <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
              <Bike className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-sm font-bold text-slate-500 mt-4 animate-pulse uppercase tracking-widest">Initialisation de la carte...</p>
        </div>
      )}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md dark:bg-slate-900/90 px-5 py-3 rounded-2xl shadow-xl border border-white/20 pointer-events-auto flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <MapIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                   <h1 className="text-base font-black tracking-tight leading-none text-slate-900 dark:text-white">Ma Tournée</h1>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
                     {appointments.length} intervention{appointments.length > 1 ? 's' : ''}
                   </p>
                </div>
            </div>
      </div>
      <div className="absolute top-4 right-14 z-20 flex bg-white/90 backdrop-blur-md dark:bg-slate-900/90 rounded-2xl border border-white/20 shadow-xl p-1">
             <Button 
                onClick={() => setMapStyle('streets-v2')} 
                variant={mapStyle === 'streets-v2' ? 'default' : 'ghost'}
                size="sm" 
                className="h-8 text-[10px] font-black px-4 rounded-xl"
             >
                PLAN
             </Button>
             <Button 
                onClick={() => setMapStyle('hybrid')} 
                variant={mapStyle === 'hybrid' ? 'default' : 'ghost'}
                size="sm" 
                className="h-8 text-[10px] font-black px-4 rounded-xl"
             >
                SAT
             </Button>
      </div>
      {selectedAppt && (
        <div className="absolute bottom-4 right-4 md:right-6 md:bottom-6 md:w-[320px] z-30 animate-in slide-in-from-bottom-8 duration-500">
            <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-xl dark:bg-slate-900/95 overflow-hidden rounded-[1.5rem] border border-white/40 dark:border-slate-800/40">
                <CardContent className="p-0">
                    <div className="p-0.5">
                        <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-[1.4rem] space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5 overflow-hidden">
                                    <div className="flex flex-wrap items-center gap-1 mb-1">
                                        <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black px-1.5 py-0 whitespace-nowrap">
                                            SUIVANT
                                        </Badge>
                                        <Badge className={cn("border-none text-[8px] font-black px-1.5 py-0 whitespace-nowrap", 
                                            STATUS_CONFIG[selectedAppt.status]?.color || 'bg-slate-500', 
                                            "text-white"
                                        )}>
                                            {STATUS_CONFIG[selectedAppt.status]?.label?.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <h4 className="text-lg font-black tracking-tighter leading-none text-slate-900 dark:text-white truncate">
                                        {selectedAppt.clientFirstName} {selectedAppt.clientLastName}
                                    </h4>
                                    <div className="flex items-center gap-1 pt-0.5 text-slate-500">
                                        <Clock className="w-3 h-3 text-primary" />
                                        <span className="font-bold text-[10px]">
                                            {new Date(selectedAppt.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 h-7 w-7 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                                    onClick={() => setSelectedAppt(null)}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="p-1 bg-slate-50 dark:bg-slate-800 rounded-md">
                                        <MapPin className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{selectedAppt.address}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="p-1 bg-slate-50 dark:bg-slate-800 rounded-md">
                                        <Bike className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                                        {selectedAppt.bikeDetails?.brand} {selectedAppt.bikeDetails?.model}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 pt-2">
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline"
                                        className="flex-1 h-9 rounded-xl gap-2 font-bold text-[10px] border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm bg-white/50 dark:bg-slate-900/50"
                                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${userCoords ? userCoords.lat+','+userCoords.lng : ''}&destination=${encodeURIComponent(selectedAppt.address)}`, '_blank')}
                                    >
                                        <Navigation className="w-3 h-3 text-primary" /> ITINÉRAIRE
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        className="flex-1 h-9 rounded-xl gap-2 font-bold text-[10px] border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm bg-white/50 dark:bg-slate-900/50"
                                        onClick={() => router.push(`/interventions?id=${selectedAppt.id}`)}
                                    >
                                        DÉTAILS <ChevronRight className="w-3 h-3" />
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    { selectedAppt.status === 'SCHEDULED' && (
                                        <Button 
                                            disabled={updatingStatus}
                                            onClick={() => handleStatusUpdate(selectedAppt.id, 'EN_ROUTE')}
                                            className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-[1.01] active:scale-[0.98] text-white font-black text-xs gap-3 shadow-md shadow-cyan-500/20 transition-all"
                                        >
                                            <Navigation className="w-4 h-4 transform rotate-45 fill-white/20" /> 
                                            <span className="tracking-tight uppercase">Partir en intervention</span>
                                        </Button>
                                    )}
                                    { selectedAppt.status === 'EN_ROUTE' && (
                                        <Button 
                                            disabled={updatingStatus}
                                            onClick={() => handleStatusUpdate(selectedAppt.id, 'ON_SITE')}
                                            className="w-full h-11 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:scale-[1.01] active:scale-[0.98] text-white font-black text-xs gap-3 shadow-md shadow-rose-500/20 transition-all"
                                        >
                                            <MapPin className="w-4 h-4 fill-white/20" /> 
                                            <span className="tracking-tight uppercase">Je suis arrivé</span>
                                        </Button>
                                    )}
                                    { selectedAppt.status === 'ON_SITE' && (
                                        <Button 
                                            disabled={updatingStatus}
                                            onClick={() => handleStatusUpdate(selectedAppt.id, 'COMPLETED')}
                                            className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-[1.01] active:scale-[0.98] text-white font-black text-xs gap-3 shadow-md shadow-emerald-500/20 transition-all"
                                        >
                                            {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bike className="w-4 h-4" />} 
                                            <span className="tracking-tight uppercase">Terminer l'intervention</span>
                                        </Button>
                                    )}
                                    <Button 
                                        disabled={updatingStatus}
                                        variant="ghost"
                                        onClick={() => {
                                            setApptToCancel(selectedAppt)
                                            setIsCancelOpen(true)
                                        }}
                                        className="w-full h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold text-[9px] uppercase tracking-widest transition-all"
                                    >
                                        Annuler l'intervention
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      <div className="absolute right-2 md:right-6 top-28 md:top-32 flex flex-col gap-2 md:gap-3 pointer-events-none z-20 max-h-[45vh] md:max-h-[60vh] overflow-y-auto no-scrollbar p-1.5 md:p-2">
          {[...appointments].sort((a,b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)).map((appt, i) => (
              <button
                key={appt.id}
                onClick={() => {
                    setSelectedAppt(appt)
                    map.current.flyTo({ center: [appt.lng, appt.lat], zoom: 15, padding: { bottom: 200 } })
                }}
                className={cn(
                    "pointer-events-auto w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex flex-col items-center justify-center transition-all bg-white/95 backdrop-blur-md dark:bg-slate-900/95 border border-white/40 dark:border-slate-800/40 hover:scale-110 group flex-shrink-0 shadow-lg",
                    selectedAppt?.id === appt.id 
                        ? "bg-slate-900 text-white border-slate-700 ring-4 ring-slate-900/20 scale-110 z-10" 
                        : "text-slate-600 dark:text-slate-400"
                )}
              >
                  <span className={cn("text-[7px] md:text-[8px] font-black uppercase mb-0.5", selectedAppt?.id === appt.id ? "text-white/70" : "opacity-60")}>#{i+1}</span>
                  <span className="text-[9px] md:text-[11px] font-black">
                      {new Date(appt.scheduledAt).getHours()}h
                  </span>
                  <div className="absolute right-full mr-3 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hidden md:block whitespace-nowrap border border-slate-700 shadow-2xl pointer-events-none">
                    {appt.clientFirstName} - {appt.address.split(',')[0]}
                  </div>
              </button>
          ))}
      </div>

      <DeleteConfirmationModal 
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        onConfirm={() => handleStatusUpdate(apptToCancel?.id, 'CANCELLED')}
        isLoading={updatingStatus}
        title="Annuler l'intervention ?"
        description="Cette action est irréversible. L'intervention sera retirée de votre tournée pour aujourd'hui."
        confirmText="CONFIRMER"
        cancelText="RETOUR"
      />
    </div>
  )
}
