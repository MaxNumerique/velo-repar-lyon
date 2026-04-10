'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Bike, ChevronLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { showToast } from '@/lib/notifications'
import BikeForm from '@/components/dashboard/BikeForm'

export default function EditBikePage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  
  const [bike, setBike] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchBike = async () => {
      try {
        const res = await fetch(`/api/bikes`) // We list all and find, or we could have a specific GET /api/bikes/[id]
        if (!res.ok) throw new Error()
        const bikes = await res.json()
        const found = bikes.find(b => b.id === id)
        if (!found) {
          showToast.error("Vélo non trouvé")
          router.push('/bikes')
          return
        }
        setBike(found)
      } catch (error) {
        showToast.error("Erreur lors du chargement")
      } finally {
        setLoading(false)
      }
    }
    fetchBike()
  }, [id, router])

  const handleUpdate = async (formData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/bikes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err)
      }

      showToast.success("Vélo mis à jour")
      router.push('/bikes')
      router.refresh()
    } catch (error) {
      showToast.error(error.message || "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
        <p className="text-slate-400 font-medium">Chargement des informations...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/bikes')}
          className="rounded-xl hover:bg-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="p-2 bg-primary/10 rounded-xl">
              <Bike className="w-6 h-6 text-primary" />
            </span>
            Modifier le Vélo
          </h1>
          <p className="text-sm text-slate-500 font-medium">{bike.brand} {bike.modelName}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 shadow-sm ring-1 ring-slate-100/50">
        <BikeForm 
          initialData={bike}
          onSubmit={handleUpdate}
          onCancel={() => router.push('/bikes')}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  )
}
