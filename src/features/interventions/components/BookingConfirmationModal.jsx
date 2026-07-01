'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { createRepairRequest } from '@/features/interventions/services/interventionService'

const STORAGE_KEY = 'velo_repair_request'

export function BookingConfirmationModal({ onSuccess }) {
  const { user: clerkUser, isLoaded } = useUser()
  const role = clerkUser?.publicMetadata?.role || 'CLIENT'
  
  const [bookingStatus, setBookingStatus] = useState('idle')
  const [bookingError, setBookingError] = useState(null)

  useEffect(() => {
    let active = true;
    const checkPendingBooking = async () => {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && isLoaded && clerkUser) {
        if (role !== 'CLIENT') {
          localStorage.removeItem(STORAGE_KEY)
          return
        }
        // Use a temporary window variable or sessionStorage to prevent double entry in Strict Mode
        if (window.__booking_submitting) return
        window.__booking_submitting = true

        setBookingStatus('submitting')
        try {
          const data = JSON.parse(saved)
          const submissionData = {
            address: data.address,
            description: data.description || '',
            bikeType: data.bikeType,
            bikeModel: data.bikeModel || null,
            bikePhotos: data.bikePhotos || [],
            issuePhotos: data.issuePhotos || [],
            servicePackageId: data.servicePackageId,
            scheduledAt: data.scheduledAt,
            technicianId: data.technicianId,
            clientInfo: {
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone,
              email: data.email
            },
            products: (data.selectedProducts || []).map(p => ({
              id: p.id,
              quantity: p.quantity,
              price: p.price
            }))
          }
          await createRepairRequest(submissionData)
          setBookingStatus('success')
          localStorage.removeItem(STORAGE_KEY)
          if (onSuccess) {
            onSuccess()
          }
        } catch (err) {
          console.error('Pending booking submission failed:', err)
          window.__booking_submitting = false
          setBookingStatus('error')
          setBookingError(err.message || "Une erreur est survenue lors de l'enregistrement.")
        }
      }
    }
    checkPendingBooking()
  }, [isLoaded, clerkUser, role, onSuccess])

  if (bookingStatus === 'idle') return null

  return (
    <Dialog 
      open={bookingStatus !== 'idle'} 
      onOpenChange={(open) => {
        if (!open && bookingStatus !== 'submitting') {
          window.__booking_submitting = false
          setBookingStatus('idle')
        }
      }}
    >
      <DialogContent className="sm:max-w-sm p-8 rounded-[2.5rem] text-center gap-4">
        {bookingStatus === 'submitting' && (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">Enregistrement...</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">Nous finalisons l'enregistrement de votre demande dans notre système.</DialogDescription>
          </div>
        )}
        {bookingStatus === 'success' && (
          <div className="space-y-6 py-2">
            <div className="flex justify-center scale-110">
              <div className="bg-green-100 p-4 rounded-full ring-8 ring-green-50">
                <CheckCircle2 className="w-12 h-12 text-green-600 animate-in zoom-in duration-500" />
              </div>
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-slate-900">C'est validé !</DialogTitle>
              <DialogDescription className="text-slate-500 text-xs leading-relaxed">
                Votre demande de réparation a été transmise. Un technicien reviendra vers vous rapidement.
              </DialogDescription>
            </div>
            <Button 
              onClick={() => {
                window.__booking_submitting = false
                setBookingStatus('idle')
              }} 
              className="w-full h-14 rounded-[2rem] bg-primary font-bold shadow-lg"
            >
              Fermer
            </Button>
          </div>
        )}
        {bookingStatus === 'error' && (
          <div className="space-y-6 py-2">
            <div className="flex justify-center">
              <div className="bg-red-100 p-4 rounded-full ring-8 ring-red-50">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-xl font-bold text-slate-900">Oups !</DialogTitle>
              <DialogDescription className="text-xs text-red-500 bg-red-50 p-3 rounded-xl">
                {bookingError || "Une erreur est survenue lors de l'enregistrement."}
              </DialogDescription>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => {
                  window.__booking_submitting = false
                  setBookingStatus('idle')
                  setTimeout(() => {
                    const saved = localStorage.getItem(STORAGE_KEY)
                    if (saved) {
                      setBookingStatus('submitting')
                    }
                  }, 100)
                }} 
                className="w-full h-12 rounded-[2rem] bg-slate-900 text-white font-bold"
              >
                Réessayer
              </Button>
              <Button 
                variant="ghost"
                onClick={() => {
                  window.__booking_submitting = false
                  localStorage.removeItem(STORAGE_KEY)
                  setBookingStatus('idle')
                }} 
                className="text-slate-400"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
