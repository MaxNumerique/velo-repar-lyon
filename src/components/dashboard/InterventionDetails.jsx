'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { FileText } from 'lucide-react'
import { StatusBadge } from "@/components/ui/status-badge"
import { Lightbox } from "@/components/ui/lightbox"

// Internal sub-components (extracted for readability)
import { ClientInfo } from './interventions/ClientInfo'
import { AppointmentInfo } from './interventions/AppointmentInfo'
import { BikeServiceInfo } from './interventions/BikeServiceInfo'
import { PhotoGallery } from './interventions/PhotoGallery'

export function InterventionDetails({ intervention, open, onOpenChange, role = 'CLIENT' }) {
  const [lightboxData, setLightboxData] = useState(null)

  if (!intervention) return null

  // Strip the old auto-generated suffix (--- Forfait: ...) from description if present
  const cleanDescription = intervention.description
    ? intervention.description.split('\n\n---\n')[0].trim()
    : ''

  const isClient = role === 'CLIENT'
  const dateStr = intervention.appointment?.scheduledAt || intervention.scheduledAt
  const date = dateStr ? new Date(dateStr) : null
  const statusToUse = intervention.appointment?.status || intervention.status

  const handlePhotoClick = (photos, index) => {
    setLightboxData({ photos, index })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl">
          <DialogHeader className="p-6 border-b bg-white dark:bg-slate-900 sticky top-0 z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">
                #{intervention.id.slice(-6)}
              </span>
              <StatusBadge status={statusToUse} />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Détails de {isClient ? 'ma demande' : "l'intervention"}
            </DialogTitle>
            <DialogDescription>
              {isClient ? "Informations concernant votre demande de réparation." : "Consultez toutes les informations relatives à cette demande."}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-8 bg-white dark:bg-slate-900">
            <ClientInfo intervention={intervention} isClient={isClient} />
            
            <AppointmentInfo date={date} />
            
            <BikeServiceInfo intervention={intervention} />

            {cleanDescription && (
              <section className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Description du problème
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border-l-4 border-primary/40">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                    {cleanDescription}
                  </p>
                </div>
              </section>
            )}

            <PhotoGallery 
              bikePhotos={intervention.bikePhotos} 
              issuePhotos={intervention.issuePhotos} 
              onPhotoClick={handlePhotoClick} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {lightboxData && (
        <Lightbox 
          photos={lightboxData.photos} 
          initialIndex={lightboxData.index} 
          onClose={() => setLightboxData(null)} 
        />
      )}
    </>
  )
}
