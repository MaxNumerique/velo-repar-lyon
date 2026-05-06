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
  Bike,
  Calendar,
  MessageSquare
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'
import { STATUS_CONFIG, calculateDistance } from '@/lib/intervention-utils'
import { canModifyIntervention } from '@/lib/date-utils'
import { StatusBadge } from '@/components/ui/status-badge'
import Link from 'next/link'
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal'

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
  userCoords 
}) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  
  const statusToUse = intervention.appointment?.status
  const config = STATUS_CONFIG[statusToUse] || STATUS_CONFIG.SCHEDULED
  const distance = calculateDistance(
    userCoords?.lat, 
    userCoords?.lng, 
    intervention.lat, 
    intervention.lng
  )

  const isAdmin = mode === 'ADMIN'
  const isTechnician = mode === 'TECHNICIAN'
  const isClient = mode === 'CLIENT'

  const dateToUse = intervention.appointment?.scheduledAt || intervention.scheduledAt
  const isToday = new Date(dateToUse).toDateString() === new Date().toDateString()
  const isExpired = !isToday && new Date(dateToUse) < new Date()
  const canModify = canModifyIntervention(intervention.appointment?.scheduledAt)

  return (
    <Card className={cn(
      "group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl",
      isToday && isClient && "ring-2 ring-primary ring-offset-2"
    )}>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left: Time & Status Indicator */}
          <div className={cn(
              "md:w-48 p-6 flex flex-col justify-center items-center gap-2 text-center transition-colors duration-500 relative",
              isToday ? "bg-black text-white" : cn(config.light, config.text), 
              "border-b md:border-b-0 md:border-r", 
              isToday ? "border-black" : config.border
          )}>
            {isToday && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2">
                <Badge className="bg-white text-primary text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">
                  AUJOURD'HUI
                </Badge>
              </div>
            )}
            <div className={cn(
              "p-2 rounded-xl transition-shadow",
              isToday ? "text-white" : "bg-white dark:bg-slate-800 shadow-sm group-hover:shadow-md"
            )}>
              <Clock className="w-5 h-5 mb-1 mx-auto" />
              <span className="font-bold text-lg block leading-tight">
                {new Date(dateToUse).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <StatusBadge 
              status={statusToUse} 
              className={cn("mt-2", isToday && "bg-white text-black")} 
            />
            {distance !== null && isTechnician && (
              <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-500">
                <LocateFixed className="w-3 h-3" /> {distance.toFixed(1)} km
              </div>
            )}
          </div>

          {/* Center: Details */}
          <div className="flex-1 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-primary">
                    {intervention.servicePackage?.title || 'Maintenance'}
                  </p>
                  {intervention.servicePackage?.price && (
                    <Badge variant="secondary" className="w-fit text-[11px] bg-slate-100 dark:bg-slate-800 font-bold px-3 py-0.5 rounded-lg border-none">
                      {intervention.servicePackage.price}€
                    </Badge>
                  )}
                </div>
                <h4 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none pt-1">
                  {intervention.clientFirstName || intervention.user?.firstName} {intervention.clientLastName || intervention.user?.lastName}
                </h4>
                <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-400 py-2 group/address">
                  <div className="mt-1 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover/address:bg-primary/10 group-hover/address:text-primary transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-base font-semibold leading-snug pt-0.5">{intervention.address}</span>
                </div>
                {(isAdmin || isClient) && intervention.appointment?.technician && (
                  <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest mt-3 bg-slate-50 dark:bg-slate-800/50 w-fit px-4 py-2 rounded-xl ring-1 ring-slate-100 dark:ring-slate-700">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span>
                      <span className="opacity-60">{isClient ? 'Votre technicien : ' : 'Technicien : '}</span>
                      <span className="text-slate-700 dark:text-slate-200 ml-1">
                        {intervention.appointment.technician.user.firstName} {intervention.appointment.technician.user.lastName}
                      </span>
                    </span>
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

                {(isAdmin || isTechnician) && statusToUse !== 'COMPLETED' && !isExpired && (
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
                      onClick={() => setIsDeleteModalOpen(true)}
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
              {isTechnician && statusToUse === 'SCHEDULED' && !isExpired && (
                <Button 
                  onClick={() => onStatusUpdate?.(intervention.id, 'EN_ROUTE')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl gap-2 font-bold shadow-lg shadow-cyan-500/20"
                >
                  <Navigation className="w-4 h-4" /> En route
                </Button>
              )}
              
              {isTechnician && statusToUse === 'EN_ROUTE' && !isExpired && (
                <>
                  <Button 
                      onClick={() => onStatusUpdate?.(intervention.id, 'ON_SITE')}
                      className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-2 font-bold shadow-lg shadow-rose-500/20"
                  >
                      <CheckCircle2 className="w-4 h-4" /> Arrivé sur place
                  </Button>

                </>
              )}

              {isTechnician && statusToUse === 'ON_SITE' && !isExpired && (
                <Button
                  onClick={() => onStatusUpdate?.(intervention.id, 'COMPLETED')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Terminer l'intervention
                </Button>
              )}

              <Link href={`/messages?id=${intervention.id}`}>
                <Button
                  variant="outline"
                  className="border-primary/20 text-primary hover:bg-primary/5 rounded-xl gap-2 font-bold h-10 px-4"
                >
                  <MessageSquare className="w-4 h-4" /> 
                  {isClient ? "Contacter le technicien" : "Contacter le client"}
                </Button>
              </Link>

              {isClient && statusToUse !== 'CANCELLED' && statusToUse !== 'COMPLETED' && (
                <div className="flex gap-2">
                  {canModify && (
                    <>
                      <Link href={`/interventions/${intervention.id}/edit`}>
                        <Button
                          variant="outline"
                          className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl gap-2 font-bold h-10 px-4"
                        >
                          <Edit2 className="w-4 h-4" /> Modifier
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="border-red-100 text-red-600 hover:bg-red-50 rounded-xl gap-2 font-bold h-10 px-4"
                      >
                        <Trash2 className="w-4 h-4" /> Annuler
                      </Button>
                    </>
                  )}
                  {!canModify && statusToUse === 'SCHEDULED' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[10px] font-bold text-amber-700 uppercase">
                        Modification bloquée (-6h)
                      </span>
                    </div>
                  )}
                </div>
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

      <DeleteConfirmationModal 
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={() => {
          onDelete?.(intervention.id)
          setIsDeleteModalOpen(false)
        }}
        title={isAdmin ? "Supprimer l'intervention" : "Annuler l'intervention"}
        description={isAdmin 
          ? "Êtes-vous sûr de vouloir supprimer définitivement cette intervention du système ?" 
          : "Voulez-vous vraiment annuler votre demande d'intervention ? Cette action est définitive."
        }
        confirmText={isAdmin ? "Supprimer" : "Confirmer l'annulation"}
      />
    </Card>
  )
}
