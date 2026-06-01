'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bike, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { showToast } from '@/lib/notifications'
import BikeForm from '@/components/dashboard/BikeForm'
import { createBike } from '@/services/bikes'

export default function NewBikePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (formData) => {
    setIsSubmitting(true)
    try {
      await createBike(formData)

      showToast.success("Vélo ajouté au parc")
      router.push('/bikes')
      router.refresh()
    } catch (error) {
      showToast.error(error.message || "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
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
            Nouveau Vélo
          </h1>
          <p className="text-sm text-slate-500 font-medium">Ajoutez une monture à votre garage.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 shadow-sm ring-1 ring-slate-100/50">
        <BikeForm 
          onSubmit={handleCreate}
          onCancel={() => router.push('/bikes')}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  )
}
