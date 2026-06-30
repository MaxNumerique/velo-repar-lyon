'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Bike, Trash2, Edit2, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { showToast } from '@/lib/notifications'
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal'
import { AdminHeader } from '@/features/admin/components/AdminHeader'
import { getBikes, deleteBike } from '@/features/bikes/services/bikeService'

export default function MyBikesPage() {
  const router = useRouter()
  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bikeToDelete, setBikeToDelete] = useState(null)

  useEffect(() => {
    fetchBikes()
  }, [])

  const fetchBikes = async () => {
    try {
      const data = await getBikes()
      setBikes(data)
    } catch (error) {
      showToast.error("Erreur lors du chargement de vos vélos")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!bikeToDelete) return
    setIsSubmitting(true)
    try {
      await deleteBike(bikeToDelete.id)
      showToast.success("Vélo supprimé")
      setBikes(prev => prev.filter(b => b.id !== bikeToDelete.id))
      setBikeToDelete(null)
    } catch (error) {
      showToast.error("Erreur lors de la suppression")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <AdminHeader
        title="Mon Parc de Vélos"
        description="Gérez vos montures pour simplifier vos futures demandes."
        icon={Bike}
        action={
          <Button 
              onClick={() => router.push('/bikes/new')}
              className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20 flex gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Ajouter un vélo</span>
          </Button>
        }
      />
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
          <p className="text-slate-400 font-medium animate-pulse">Chargement de votre parc...</p>
        </div>
      ) : bikes.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bike className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Votre garage est vide</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2 font-medium">
                Ajoutez vos vélos maintenant pour gagner du temps lors de vos prochaines réparations.
            </p>
            <Button 
                variant="outline" 
                onClick={() => router.push('/bikes/new')}
                className="mt-8 rounded-2xl h-12 px-8 font-bold border-slate-200 hover:bg-slate-50 transition-all"
            >
                Ajouter ma première monture
            </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bikes.map((bike) => (
            <Card key={bike.id} className="group relative bg-white dark:bg-slate-800 border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2.25rem] overflow-hidden">
              <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                {bike.imageUrl ? (
                  <img 
                    src={bike.imageUrl} 
                    alt={bike.brand} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Bike className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                        size="icon" 
                        variant="secondary"
                        onClick={() => router.push(`/bikes/${bike.id}/edit`)}
                        className="w-9 h-9 rounded-xl shadow-lg hover:bg-white"
                    >
                        <Edit2 className="w-4 h-4 text-slate-700" />
                    </Button>
                    <Button 
                        size="icon" 
                        variant="destructive"
                        onClick={() => setBikeToDelete(bike)}
                        className="w-9 h-9 rounded-xl shadow-lg"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
                <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
                        {bike.type || 'Autre'}
                    </span>
                </div>
              </div>
              <CardContent className="p-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">{bike.brand}</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 truncate">{bike.modelName || 'Modèle inconnu'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <DeleteConfirmationModal
        open={!!bikeToDelete}
        onOpenChange={(open) => !open && setBikeToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
        title="Supprimer le vélo ?"
        description={`Voulez-vous vraiment supprimer votre ${bikeToDelete?.brand} ${bikeToDelete?.modelName} ? Cette action est irréversible.`}
      />
    </div>
  )
}
