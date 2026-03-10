'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Navigation, 
  Bell, 
  Info,
  LocateFixed,
  Edit2,
  Trash2,
  MoreVertical,
  Bike,
  Calendar
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'
import { STATUS_CONFIG, calculateDistance } from '@/lib/intervention-utils'
import Link from 'next/link'

/**
 * Shared InterventionCard Component
 * Used by both Admin and Technician dashboards.
 */
export function InterventionCard({ 
  intervention, 
  mode = 'TECHNICIAN', 
  onStatusUpdate, 
  onDelete, 
  onShowDetails,
  onNotifyClient,
  userCoords 
}) {
  const statusToUse = intervention.appointment?.status || intervention.status
  const config = STATUS_CONFIG[statusToUse] || STATUS_CONFIG.SCHEDULED
  const distance = calculateDistance(
    userCoords?.lat, 
    userCoords?.lng, 
    intervention.lat, 
    intervention.lng
  )

  const isAdmin = mode === 'ADMIN'
  const isTechnician = mode === 'TECHNICIAN'

  return (
    <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left: Time & Status Indicator */}
          <div className={cn(
              "md:w-48 p-6 flex flex-col justify-center items-center gap-2 text-center transition-colors duration-500",
              config.light, config.text, "border-b md:border-b-0 md:border-r", config.border
          )}>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm group-hover:shadow-md transition-shadow">
              <Clock className="w-5 h-5 mb-1 mx-auto" />
              <span className="font-bold text-lg block leading-tight">
                {new Date(intervention.appointment?.scheduledAt || intervention.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest opacity-80 mt-2">
              {config.label}
            </span>
            {distance !== null && (
              <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-500">
                <LocateFixed className="w-3 h-3" /> {distance.toFixed(1)} km
              </div>
            )}
          </div>

          {/* Center: Details */}
          <div className="flex-1 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                    {intervention.servicePackage?.title || 'Maintenance'}
                  </p>
                  {intervention.servicePackage?.price && (
                    <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 font-bold">
                      {intervention.servicePackage.price}€
                    </Badge>
                  )}
                </div>
                <h4 className="text-xl font-bold flex items-center gap-2">
                  {intervention.clientFirstName || intervention.user?.firstName} {intervention.clientLastName || intervention.user?.lastName}
                </h4>
                <div className="flex items-center gap-2 text-slate-500 py-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium leading-tight line-clamp-1">{intervention.address}</span>
                </div>
                {isAdmin && intervention.appointment?.technician && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Technicien: {intervention.appointment.technician.user.firstName} {intervention.appointment.technician.user.lastName}
                  </div>
                )}
              </div>

              {/* Top Right: Essential Controls (Info, Status Toggle) */}
              <div className="flex flex-col gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full bg-slate-50 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                  onClick={() => onShowDetails?.(intervention)}
                  title="Plus d'infos"
                >
                  <Info className="w-4 h-4" />
                </Button>

                {statusToUse !== 'COMPLETED' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full bg-slate-50 hover:bg-primary/10 hover:text-primary transition-all shadow-sm group outline-none focus:ring-0" 
                        title="Modifier le statut"
                      >
                        <div className={cn("w-3 h-3 rounded-full shadow-inner transition-all group-hover:scale-125", config.color)} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px] rounded-2xl border-none shadow-2xl p-2 bg-white dark:bg-slate-900 border border-slate-100">
                      <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Statut rapide</p>
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <DropdownMenuItem 
                          key={key}
                          onClick={() => onStatusUpdate?.(intervention.id, key)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                            statusToUse === key ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          )}
                        >
                          <div className={cn("w-4 h-4 rounded-full", cfg.color)} />
                          <span className={cn("text-xs font-bold", statusToUse === key ? "text-primary" : "text-slate-600 dark:text-slate-400")}>
                            {cfg.label}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {isAdmin && (
                  <>
                    <Link href={`/admin/interventions/${intervention.id}`}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full bg-slate-50 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full bg-slate-50 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                      onClick={() => onDelete?.(intervention.id)}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}

                {isTechnician && statusToUse !== 'COMPLETED' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-slate-50 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(intervention.address)}`, '_blank')}
                    title="Itinéraire"
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Bottom Row: Journey Actions (Technician) or Audit (Admin) */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {isTechnician && statusToUse === 'SCHEDULED' && (
                <Button 
                  onClick={() => onStatusUpdate?.(intervention.id, 'EN_ROUTE')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl gap-2 font-bold shadow-lg shadow-cyan-500/20"
                >
                  <Navigation className="w-4 h-4" /> En route
                </Button>
              )}
              
              {isTechnician && statusToUse === 'EN_ROUTE' && (
                <>
                  <Button 
                      onClick={() => onStatusUpdate?.(intervention.id, 'ON_SITE')}
                      className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-2 font-bold shadow-lg shadow-rose-500/20"
                  >
                      <CheckCircle2 className="w-4 h-4" /> Arrivé sur place
                  </Button>
                  <Button 
                      variant="outline"
                      onClick={() => onNotifyClient?.(intervention.id)}
                      className="border-cyan-200 text-cyan-600 rounded-xl gap-2 font-bold"
                  >
                      <Bell className="w-4 h-4" /> Prévenir le client
                  </Button>
                </>
              )}

              {isTechnician && statusToUse === 'ON_SITE' && (
                <Button 
                  onClick={() => onStatusUpdate?.(intervention.id, 'COMPLETED')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Terminer l'intervention
                </Button>
              )}

              {isAdmin && (
                 <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                       <Calendar className="w-3 h-3" /> 
                       {new Date(intervention.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="flex items-center gap-1">
                       <Bike className="w-3 h-3" /> 
                       {intervention.bikeModel || intervention.bike?.modelName || 'Vélo libre'}
                    </span>
                 </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
