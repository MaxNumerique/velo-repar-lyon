'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { showToast } from '@/lib/notifications'
import Link from 'next/link'

// Modular Components
import ClientInformationForm from '@/components/admin/interventions/ClientInformationForm'
import BikeServiceForm from '@/components/admin/interventions/BikeServiceForm'
import AppointmentScheduler from '@/components/admin/interventions/AppointmentScheduler'
import ProductManager from '@/components/admin/ProductManager'
import InterventionCostSummary from '@/components/admin/InterventionCostSummary'

const BIK_TYPES = ["VTT", "VTC", "VAE", "ROUTE", "VILLE"]

export default function NewInterventionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState([])
  const [images, setImages] = useState([])
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
    bikeModel: '',
    bikeType: '',
    servicePackageId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00'
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/services').then(res => res.json()),
      fetch('/api/admin/products?isActive=true').then(res => res.json())
    ]).then(([services, products]) => {
      setPackages(services)
      setAllProducts(products)
    }).catch(err => console.error("Erreur chargement données:", err))
  }, [])

  const updateForm = (updates) => setFormData(prev => ({ ...prev, ...updates }))

  const handleLocationSelect = async ({ address, lat, lng }) => {
    updateForm({ address, lat, lng })
    setAssignedTech(null) // Reset while fetching

    try {
      const res = await fetch(`/api/admin/interventions/assign-technician?lat=${lat}&lng=${lng}`)
      if (res.ok) {
        const data = await res.json()
        setAssignedTech(data)
      } else {
        showToast.error("Pas de technicien disponible pour ce secteur")
      }
    } catch (error) {
       console.error("Assign tech error:", error)
    }
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
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
      const res = await fetch('/api/admin/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduledAt,
          images,
          technicianId: assignedTech?.id,
          products: selectedProducts.map(sp => ({
            productId: sp.productId,
            quantity: sp.quantity
          }))
        })
      })

      if (res.ok) {
        showToast.success('Intervention créée avec succès')
        router.push('/admin/interventions')
      } else {
        const err = await res.json()
        showToast.error(err.error || 'Une erreur est survenue')
      }
    } catch (error) {
      showToast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const selectedPackage = packages.find(p => p.id === formData.servicePackageId)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/interventions">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Nouvelle Intervention</h1>
          <p className="text-xs text-slate-500">Planifiez une nouvelle réparation à domicile.</p>
        </div>
      </div>

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
            images={images} 
            setImages={setImages} 
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
        </div>
      </form>
    </div>
  )
}
