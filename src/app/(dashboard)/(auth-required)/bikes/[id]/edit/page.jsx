'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Bike, Loader2 } from 'lucide-react'
import { showToast } from '@/lib/notifications'
import BikeForm from '@/features/bikes/components/BikeForm'
import { AdminHeader } from '@/features/admin/components/AdminHeader'
import { getBikes, updateBike } from '@/features/bikes/services/bikeService'

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
        const bikes = await getBikes()
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
      await updateBike(id, formData)

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
      <AdminHeader
        title="Modifier le Vélo"
        description={`${bike.brand} ${bike.modelName}`}
        icon={Bike}
        backLink="/bikes"
      />

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
