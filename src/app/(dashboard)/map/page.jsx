'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { Loader2, Navigation, Map as MapIcon, Calendar, Clock, User as UserIcon, Bike } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { showToast } from '@/lib/notifications'
import { cn } from '@/lib/utils'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function TechnicianMapPage() {
  const { user: clerkUser, isLoaded } = useUser()
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAppt, setSelectedAppt] = useState(null)

  useEffect(() => {
    if (isLoaded && clerkUser) {
      fetchAppointments()
    }
  }, [isLoaded, clerkUser])

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/admin/interventions')
      if (!res.ok) throw new Error()
      const data = await res.json()
      
      // Filter for today's interventions that have coordinates
      const todayString = new Date().toDateString()
      const validAppts = data.filter(appt => {
        const dateToUse = appt.appointment?.scheduledAt || appt.scheduledAt
        if (!dateToUse) return false
        return new Date(dateToUse).toDateString() === todayString && appt.lat && appt.lng
      })
      
      setAppointments(validAppts)
    } catch (error) {
      showToast.error("Erreur lors du chargement des interventions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!mapContainer.current || loading) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json', // Basic demo style
      center: [4.8357, 45.7640], // Lyon default center
      zoom: 12
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    // Add markers for each appointment
    if (appointments.length > 0) {
        appointments.forEach((appt) => {
            const el = document.createElement('div')
            el.className = 'w-8 h-8 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform'
            el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>`

            el.addEventListener('click', () => {
                setSelectedAppt(appt)
                map.current.flyTo({
                    center: [appt.lng, appt.lat],
                    zoom: 15
                })
            })

            new maplibregl.Marker(el)
                .setLngLat([appt.lng, appt.lat])
                .addTo(map.current)
        })

        // Auto-fit to bounds if multiple
        if (appointments.length > 1) {
            const bounds = new maplibregl.LngLatBounds()
            appointments.forEach(appt => bounds.extend([appt.lng, appt.lat]))
            map.current.fitBounds(bounds, { padding: 50 })
        } else if (appointments.length === 1) {
            map.current.setCenter([appointments[0].lng, appointments[0].lat])
        }
    }

    return () => map.current.remove()
  }, [loading, appointments])

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Chargement de la carte...</p>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-100px)] w-full overflow-hidden rounded-3xl shadow-xl">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Search/Header Overlay */}
      <div className="absolute top-4 left-4 right-4 md:left-6 md:top-6 z-10 flex flex-col gap-4 pointer-events-none">
        <div className="flex items-center gap-4">
            <div className="bg-white/90 backdrop-blur-md dark:bg-slate-900/90 px-6 py-3 rounded-2xl shadow-xl border border-white/20 pointer-events-auto">
                <h1 className="text-lg font-bold flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-primary" /> Ma Tournée
                </h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lyon & Agglomération</p>
            </div>
        </div>
      </div>

      {/* Appointment Card Overlay */}
      {selectedAppt && (
        <div className="absolute bottom-6 left-6 right-6 md:left-auto md:w-96 z-10 animate-in slide-in-from-bottom-4 duration-300">
            <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-md dark:bg-slate-900/95 overflow-hidden rounded-[2.5rem]">
                <CardContent className="p-0">
                    <div className="p-1">
                        <div className="bg-primary/5 p-6 rounded-[2.2rem] space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <span className="font-bold text-sm">
                                            {new Date(selectedAppt.appointment?.scheduledAt || selectedAppt.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-black tracking-tight leading-tight">
                                        {selectedAppt.user?.firstName} {selectedAppt.user?.lastName}
                                    </h4>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="rounded-full -mt-2 -mr-2"
                                    onClick={() => setSelectedAppt(null)}
                                >
                                    <Loader2 className="w-4 h-4 rotate-45" />
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-medium truncate">{selectedAppt.address}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl">
                                    <Bike className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-medium">{selectedAppt.bike?.brand} {selectedAppt.bike?.modelName || selectedAppt.bikeModel}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button 
                                    className="rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20"
                                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedAppt.address)}`, '_blank')}
                                >
                                    <Navigation className="w-4 h-4" /> Itinéraire
                                </Button>
                                <Button 
                                    variant="secondary"
                                    className="rounded-2xl gap-2 font-bold dark:bg-slate-800"
                                    onClick={() => window.location.href = `/interventions`}
                                >
                                    Détails <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      {/* Quick Access List */}
      <div className="absolute right-6 top-24 hidden lg:flex flex-col gap-3 pointer-events-none">
          {appointments.map(appt => (
              <button
                key={appt.id}
                onClick={() => {
                    setSelectedAppt(appt)
                    map.current.flyTo({ center: [appt.lng, appt.lat], zoom: 15 })
                }}
                className={cn(
                    "pointer-events-auto w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-white/90 backdrop-blur-md dark:bg-slate-900/90 shadow-xl border border-white/20 hover:scale-110",
                    selectedAppt?.id === appt.id ? "bg-primary text-white border-primary" : "text-slate-600 dark:text-slate-400"
                )}
              >
                  <span className="text-[10px] font-black">
                      {new Date(appt.appointment?.scheduledAt || appt.scheduledAt).getHours()}h
                  </span>
              </button>
          ))}
      </div>
    </div>
  )
}
