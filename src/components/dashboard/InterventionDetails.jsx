'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Bike, 
  User, 
  Phone, 
  FileText, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function InterventionDetails({ intervention, open, onOpenChange }) {
  if (!intervention) return null

  const appointment = intervention.appointment
  const dateStr = appointment?.scheduledAt || intervention.scheduledAt
  const date = dateStr ? new Date(dateStr) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl">
        <DialogHeader className="p-6 border-b bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
              #{intervention.id.slice(-6)}
            </Badge>
            <Badge className={cn(
              "text-[10px] uppercase font-bold tracking-wider",
              intervention.status === 'COMPLETED' ? "bg-green-500 hover:bg-green-600" : 
              intervention.status === 'IN_PROGRESS' || intervention.status === 'ON_SITE' ? "bg-blue-500 hover:bg-blue-600" : "bg-slate-500 hover:bg-slate-600"
            )}>
              {intervention.status}
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Détails de l'intervention
          </DialogTitle>
          <DialogDescription>
            Consultez toutes les informations relatives à cette demande.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-8 bg-white dark:bg-slate-900">
          {/* Client Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
              <User className="w-4 h-4" /> Client
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-3 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="font-bold text-lg">{intervention.clientFirstName || intervention.user?.firstName} {intervention.clientLastName || intervention.user?.lastName}</p>
                {(intervention.clientPhone || intervention.user?.phone) && (
                  <a href={`tel:${intervention.clientPhone || intervention.user.phone}`} className="flex items-center gap-2 text-primary font-bold text-sm bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-colors">
                    <Phone className="w-4 h-4" /> Appeler
                  </a>
                )}
              </div>
              <div className="flex items-start gap-2 text-slate-500">
                <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                <span className="text-sm font-medium">{intervention.address}</span>
              </div>
            </div>
          </section>

          {/* Appointment Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Rendez-vous
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 underline decoration-primary/30 underline-offset-4">Date</p>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Calendar className="w-4 h-4 text-primary" />
                  {date ? date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 underline decoration-primary/30 underline-offset-4">Heure</p>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Clock className="w-4 h-4 text-primary" />
                  {date ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </div>
              </div>
            </div>
          </section>

          {/* Bike & Service Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
              <Bike className="w-4 h-4" /> Vélo & Service
            </h3>
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 underline decoration-primary/30 underline-offset-4">Vélo</p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {intervention.bike?.brand} {intervention.bikeModel || intervention.bike?.modelName} 
                    <span className="text-slate-400 font-medium ml-2 text-sm italic">
                      ({intervention.bikeType || intervention.bike?.type?.name})
                    </span>
                  </p>
                </div>
                <Bike className="w-8 h-8 text-primary/20" />
              </div>
              <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl border border-primary/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-12 h-12 text-primary" />
                </div>
                <p className="text-[10px] text-primary/60 font-bold uppercase mb-1 tracking-widest">Forfait sélectionné</p>
                <p className="font-black text-xl text-primary">{intervention.servicePackage?.title || 'Réparation simple'}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{intervention.servicePackage?.description}</p>
                {intervention.servicePackage?.price && (
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Prix :</span>
                        <p className="font-black text-2xl text-slate-900 dark:text-white">{intervention.servicePackage.price}€</p>
                    </div>
                )}
              </div>
            </div>
          </section>

          {/* Description Section */}
          {intervention.description && (
            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Description du problème
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border-l-4 border-primary shadow-inner">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 italic">
                  "{intervention.description}"
                </p>
              </div>
            </section>
          )}

          {/* Photos Section */}
          {intervention.photos && intervention.photos.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Photos ({intervention.photos.length})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {intervention.photos.map((url, i) => (
                  <div key={i} className="aspect-video relative rounded-2xl overflow-hidden group cursor-zoom-in border border-slate-100 dark:border-slate-800 shadow-sm">
                    <img 
                        src={url} 
                        alt={`Photo de l'intervention ${i+1}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Voir plus</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
