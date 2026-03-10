'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { 
  Loader2, 
  Navigation, 
  Map as MapIcon, 
  Calendar, 
  Clock, 
  User as UserIcon, 
  Bike, 
  MapPin, 
  ChevronRight, 
  X,
  Layers,
  LocateFixed
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { showToast } from '@/lib/notifications'
import { cn } from '@/lib/utils'
import { geocodeAddress } from '@/lib/google-maps'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const LYON_BOUNDS = [[4.70, 45.65], [4.95, 45.85]]

export default function TechnicianMapPage() {
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

  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY

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
      const res = await fetch('/api/admin/interventions')
      if (!res.ok) throw new Error()
      const data = await res.json()
      
      const todayString = new Date().toDateString()
      const todayAppts = data.filter(appt => {
        const dateToUse = appt.appointment?.scheduledAt || appt.scheduledAt
        if (!dateToUse) return false
        return new Date(dateToUse).toDateString() === todayString
      })

      // Geocode missing coordinates
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
    
    // Clear old markers
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
    <div className="relative h-[calc(100vh-100px)] w-full overflow-hidden rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
      
      {/* Map Container - ALWAYS rendered */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Loading Overlay */}
      {(!isLoaded || !mapLoaded) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-50 transition-opacity">
          <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
              <Bike className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-sm font-bold text-slate-500 mt-4 animate-pulse uppercase tracking-widest">Initialisation de la carte...</p>
        </div>
      )}

      {/* Header Overlay */}
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

      {/* Map Switcher */}
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

      {/* Appointment Card */}
      {selectedAppt && (
        <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[400px] z-30 animate-in slide-in-from-bottom-8 duration-500">
            <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-xl dark:bg-slate-900/95 overflow-hidden rounded-[2.5rem] border border-white/40 dark:border-slate-800/40">
                <CardContent className="p-0">
                    <div className="p-1">
                        <div className="bg-slate-50 dark:bg-slate-800/20 p-6 rounded-[2.2rem] space-y-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black px-3 py-1 mb-2">
                                        PROCHAINE ÉTAPE
                                    </Badge>
                                    <h4 className="text-2xl font-black tracking-tighter leading-none text-slate-900 dark:text-white">
                                        {selectedAppt.clientFirstName} {selectedAppt.clientLastName}
                                    </h4>
                                    <div className="flex items-center gap-2 pt-1 text-slate-500">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <span className="font-bold text-sm">
                                            {new Date(selectedAppt.appointment?.scheduledAt || selectedAppt.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 h-10 w-10 hover:bg-red-50 hover:text-red-500 transition-colors"
                                    onClick={() => setSelectedAppt(null)}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <MapPin className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{selectedAppt.address}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <Bike className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {selectedAppt.bike?.brand} {selectedAppt.bike?.modelName || selectedAppt.bikeModel}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button 
                                    className="h-12 rounded-2xl gap-2 font-black shadow-lg shadow-primary/30 text-xs md:text-sm"
                                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${userCoords ? userCoords.lat+','+userCoords.lng : ''}&destination=${encodeURIComponent(selectedAppt.address)}`, '_blank')}
                                >
                                    <Navigation className="w-4 h-4 fill-white" /> ITINÉRAIRE
                                </Button>
                                <Button 
                                    variant="secondary"
                                    className="h-12 rounded-2xl gap-2 font-black dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs md:text-sm"
                                    onClick={() => window.location.href = `/interventions`}
                                >
                                    DÉTAILS <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      {/* Quick Access List */}
      <div className="absolute right-6 top-32 hidden lg:flex flex-col gap-3 pointer-events-none">
          {appointments.sort((a,b) => new Date(a.appointment?.scheduledAt || a.scheduledAt) - new Date(b.appointment?.scheduledAt || b.scheduledAt)).map((appt, i) => (
              <button
                key={appt.id}
                onClick={() => {
                    setSelectedAppt(appt)
                    map.current.flyTo({ center: [appt.lng, appt.lat], zoom: 15, padding: { bottom: 200 } })
                }}
                className={cn(
                    "pointer-events-auto w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all bg-white/90 backdrop-blur-md dark:bg-slate-900/90 shadow-2xl border border-white/20 hover:scale-110 group",
                    selectedAppt?.id === appt.id ? "bg-primary text-white border-primary ring-4 ring-primary/20 scale-105" : "text-slate-600 dark:text-slate-400"
                )}
              >
                  <span className="text-[8px] font-black uppercase opacity-60 mb-0.5">#{i+1}</span>
                  <span className="text-[11px] font-black">
                      {new Date(appt.appointment?.scheduledAt || appt.scheduledAt).getHours()}h
                  </span>
                  <div className="absolute right-full mr-3 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700 shadow-2xl">
                    {appt.clientFirstName} - {appt.address.split(',')[0]}
                  </div>
              </button>
          ))}
      </div>
    </div>
  )
}
