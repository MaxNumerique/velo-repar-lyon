'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { showToast } from '@/lib/notifications'
import { getAdminIntervention, updateAdminIntervention } from '@/features/interventions/services/interventionService'
import { getAdminServices } from '@/features/products/services/repairServiceService'
import { getTechnicians } from '@/features/users/services/userService'
import { getAdminProducts } from '@/features/products/services/productService'
import ClientInformationForm from '@/features/admin/components/interventions/ClientInformationForm'
import BikeServiceForm from '@/features/admin/components/interventions/BikeServiceForm'
import InterventionScheduler from '@/features/admin/components/interventions/InterventionScheduler'
import ProductManager from '@/features/admin/components/products/ProductManager'
import InterventionCostSummary from '@/features/admin/components/InterventionCostSummary'
import { AdminHeader } from '@/features/admin/components/AdminHeader'
import { normalizeBikeType } from '@/features/interventions/services/interventionService'

export default function EditInterventionPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [packages, setPackages] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [bikePhotos, setBikePhotos] = useState([])
  const [formData, setFormData] = useState({
    status: '',
    clientFirstName: '',
    clientLastName: '',
    clientPhone: '',
    address: '',
    bikeBrand: '',
    bikeModel: '',
    bikeType: '',
    servicePackageId: '',
    description: '',
    scheduledAt: '',
    technicianId: ''
  })

  useEffect(() => {
    fetchInitialData()
  }, [id])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [interData, pkgData, techData, prodData] = await Promise.all([
        getAdminIntervention(id),
        getAdminServices(),
        getTechnicians(),
        getAdminProducts('isActive=true')
      ])
      setFormData({
        status: interData.status || 'PENDING',
        clientFirstName: interData.clientFirstName || '',
        clientLastName: interData.clientLastName || '',
        clientPhone: interData.clientPhone || '',
        address: interData.address || '',
        bikeBrand: interData.bikeDetails?.brand || '',
        bikeModel: interData.bikeDetails?.model || '',
        bikeType: normalizeBikeType(interData.bikeDetails?.type),
        servicePackageId: interData.servicePackageId || '',
        description: interData.description || '',
        scheduledAt: interData.scheduledAt ? new Date(interData.scheduledAt).toISOString().slice(0, 16) : '',
        technicianId: interData.technicianId || ''
      })
      setPackages(pkgData)
      setTechnicians(techData)
      setAllProducts(prodData)
      setBikePhotos(interData.bikePhotos || [])
      if (interData.products) {
        setSelectedProducts(interData.products.map(ip => ({
          productId: ip.productId,
          quantity: ip.quantity,
          product: ip.product
        })))
      }
    } catch (error) {
      console.error("Fetch error:", error)
      showToast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }
  const updateForm = (updates) => setFormData(prev => ({ ...prev, ...updates }))
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateAdminIntervention(id, {
        ...formData,
        bikePhotos,
        products: selectedProducts.map(sp => ({
          productId: sp.productId,
          quantity: sp.quantity
        }))
      })
      showToast.success('Intervention mise à jour')
      router.push('/admin/interventions')
    } catch (error) {
      showToast.error(error.message || 'Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Chargement de l'intervention...</p>
      </div>
    )
  }
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <AdminHeader 
        title="Modifier l'Intervention"
        description={`#${id.slice(-6)} - ${formData.clientFirstName} ${formData.clientLastName}`}
        backLink="/admin/interventions"
      />
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ClientInformationForm 
            formData={formData} 
            updateForm={updateForm} 
            onLocationSelect={({ address, lat, lng }) => updateForm({ address, lat, lng })} 
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
          <InterventionScheduler 
            formData={formData} 
            updateForm={updateForm} 
            loading={saving} 
            technicians={technicians}
            isEdit={true}
          />

          <InterventionCostSummary 
            servicePrice={packages.find(p => p.id === formData.servicePackageId)?.price || 0}
            selectedProducts={selectedProducts}
          />
        </div>
      </form>
    </div>
  )
}
