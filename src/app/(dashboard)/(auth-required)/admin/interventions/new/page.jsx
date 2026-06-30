'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { showToast } from '@/lib/notifications'
import { createAdminIntervention, assignTechnician } from '@/features/interventions/services/interventionService'
import { getAdminServices } from '@/features/products/services/repairServiceService'
import { getAdminProducts } from '@/features/products/services/productService'

import ClientInformationForm from '@/features/admin/components/interventions/ClientInformationForm'
import BikeServiceForm from '@/features/admin/components/interventions/BikeServiceForm'
import AppointmentScheduler from '@/features/admin/components/interventions/AppointmentScheduler'
import ProductManager from '@/features/admin/components/products/ProductManager'
import InterventionCostSummary from '@/features/admin/components/InterventionCostSummary'
import { AdminHeader } from '@/features/admin/components/AdminHeader'

const BIK_TYPES = ["VTT", "VTC", "VAE", "ROUTE", "VILLE"]

export default function NewInterventionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState([])
  const [bikePhotos, setBikePhotos] = useState([])
  const [assignedTech, setAssignedTech] = useState(null)
  const [allProducts, setAllProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [formData, setFormData] = useState({
    clientFirstName: '',
    clientLastName: '',
    clientPhone: '',
    address: '',
    lat: null,
    lng: null,
    bikeBrand: '',
    bikeModel: '',
    bikeType: '',
    servicePackageId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00'
  })

  useEffect(() => {
    Promise.all([
      getAdminServices(),
      getAdminProducts('isActive=true')
    ]).then(([services, products]) => {
      setPackages(services)
      setAllProducts(products)
    }).catch(err => console.error("Erreur chargement données:", err))
  }, [])

  const updateForm = (updates) => setFormData(prev => ({ ...prev, ...updates }))
  const handleLocationSelect = async ({ address, lat, lng }) => {
    updateForm({ address, lat, lng })
    setAssignedTech(null) 
    try {
      const data = await assignTechnician(lat, lng)
      setAssignedTech(data)
    } catch (error) {
       console.error("Assign tech error:", error)
       showToast.error("Pas de technicien disponible pour ce secteur")
    }
  }
  const removeImage = (index) => {
    setBikePhotos(prev => prev.filter((_, i) => i !== index))
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.time) {
      showToast.error("Veuillez choisir une heure")
      return
    }
    setLoading(true)
    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}`).toISOString()
      await createAdminIntervention({
        ...formData,
        scheduledAt,
        bikePhotos,
        technicianId: assignedTech?.id,
        products: selectedProducts.map(sp => ({
          productId: sp.productId,
          quantity: sp.quantity
        }))
      })
 
      showToast.success('Intervention créée avec succès')
      router.push('/admin/interventions')
    } catch (error) {
      showToast.error(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const selectedPackage = packages.find(p => p.id === formData.servicePackageId)
  const isClientInfoComplete = formData.clientFirstName && formData.clientLastName && formData.clientPhone && formData.address
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <AdminHeader 
        title="Nouvelle Intervention"
        description="Planifiez une nouvelle réparation à domicile."
        backLink="/admin/interventions"
      />
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ClientInformationForm 
            formData={formData} 
            updateForm={updateForm} 
            onLocationSelect={handleLocationSelect} 
          />
          <BikeServiceForm 
            formData={formData} 
            updateForm={updateForm} 
            packages={packages} 
            bikePhotos={bikePhotos} 
            setBikePhotos={setBikePhotos} 
          />
          <ProductManager 
            allProducts={allProducts} 
            selectedProducts={selectedProducts} 
            setSelectedProducts={setSelectedProducts} 
          />
        </div>

        <div className="space-y-6">
          <AppointmentScheduler 
            formData={formData} 
            updateForm={updateForm} 
            loading={loading} 
            assignedTech={assignedTech} 
            disabled={!isClientInfoComplete}
          />
          <InterventionCostSummary 
            servicePrice={selectedPackage?.price || 0}
            selectedProducts={selectedProducts}
          />
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Assignation</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Technicien</span>
              <span className="text-xs font-bold text-primary">{assignedTech ? assignedTech.name : "-"}</span>
            </div>
            <p className="text-[9px] text-slate-400 italic mt-3">
              L'assignation est faite automatiquement en fonction du secteur.
            </p>
          </div>
          <p className="text-[10px] text-slate-400 mt-4">
            * Les champs marqués d'un astérisque sont obligatoires.
          </p>
        </div>
      </form>
    </div>
  )
}
