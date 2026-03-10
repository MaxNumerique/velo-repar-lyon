'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { showToast } from '@/lib/notifications'
import Link from 'next/link'

// Modular Components
import ClientInformationForm from '@/components/admin/interventions/ClientInformationForm'
import BikeServiceForm from '@/components/admin/interventions/BikeServiceForm'
import AppointmentScheduler from '@/components/admin/interventions/AppointmentScheduler'
import ProductManager from '@/components/admin/ProductManager'
import InterventionCostSummary from '@/components/admin/InterventionCostSummary'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function EditInterventionPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [packages, setPackages] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([]) // Array of { productId, quantity, product: { name, price } }

  const [formData, setFormData] = useState({
    status: '',
    clientFirstName: '',
    clientLastName: '',
    clientPhone: '',
    address: '',
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
      const [interRes, pkgRes, techRes, prodRes] = await Promise.all([
        fetch(`/api/admin/interventions/${id}`),
        fetch('/api/admin/services'),
        fetch('/api/admin/users?role=TECHNICIAN'),
        fetch('/api/admin/products?isActive=true')
      ])
      
      const [interData, pkgData, techData, prodData] = await Promise.all([
        interRes.json(),
        pkgRes.json(),
        techRes.json(),
        prodRes.json()
      ])

      setFormData({
        status: interData.status || 'PENDING',
        clientFirstName: interData.clientFirstName || '',
        clientLastName: interData.clientLastName || '',
        clientPhone: interData.clientPhone || '',
        address: interData.address || '',
        bikeModel: interData.bikeModel || '',
        bikeType: interData.bikeType || '',
        servicePackageId: interData.servicePackageId || '',
        description: interData.description || '',
        scheduledAt: interData.appointment?.scheduledAt ? new Date(interData.appointment.scheduledAt).toISOString().slice(0, 16) : '',
        technicianId: interData.appointment?.technicianId || ''
      })
      
      setPackages(pkgData)
      setTechnicians(techData)
      setAllProducts(prodData)
      
      // Setup selected products from intervention data
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
      const res = await fetch(`/api/admin/interventions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          products: selectedProducts.map(sp => ({
            productId: sp.productId,
            quantity: sp.quantity
          }))
        })
      })
      
      if (res.ok) {
        showToast.success('Intervention mise à jour')
        router.push('/admin/interventions')
      } else {
        const error = await res.json()
        showToast.error(error.message || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      showToast.error('Une erreur est survenue')
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
            images={[]} // Edit page doesn't seem to support images yet in form
            setImages={() => {}} 
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
