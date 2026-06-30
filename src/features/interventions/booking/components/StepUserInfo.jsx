'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AddressAutocomplete from '@/components/shared/AddressAutocomplete'
import { useRepair } from '@/features/interventions/booking/context/RepairContext'
import { getAvailability } from '@/features/interventions/services/interventionService'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export function StepUserInfo() {
  const { formData: data, updateFormData: updateData } = useRepair()
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(null)

  const checkAddressAvailability = async (addr) => {
    if (!addr || addr.trim() === '') {
      updateData({ isAddressCovered: false })
      return
    }
    try {
      setChecking(true)
      setError(null)
      await getAvailability(addr)
      updateData({ isAddressCovered: true })
    } catch (err) {
      setError(err.message || "Désolé, nous ne couvrons pas encore ce secteur.")
      updateData({ isAddressCovered: false })
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (data.address && !data.isAddressCovered) {
      checkAddressAvailability(data.address)
    }
  }, [])

  const handleChange = (e) => {
    updateData({ [e.target.name]: e.target.value })
  }

  const handleAddressChange = (address) => {
    updateData({ address, isAddressCovered: false })
    setError(null)
  }

  const handleLocationSelect = async ({ address }) => {
    updateData({ address })
    await checkAddressAvailability(address)
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Vos Informations</h2>
        <p className="text-sm text-slate-500">Dites-nous qui vous êtes pour que nous puissions vous contacter.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="Jean"
            value={data.firstName}
            onChange={handleChange}
            className="rounded-xl h-12"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Dupont"
            value={data.lastName}
            onChange={handleChange}
            className="rounded-xl h-12"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">N° Téléphone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="06 12 34 56 78"
          value={data.phone}
          onChange={handleChange}
          className="rounded-xl h-12"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Adresse de la réparation</Label>
        <AddressAutocomplete
          value={data.address}
          onChange={handleAddressChange}
          onLocationSelect={handleLocationSelect}
          placeholder="123 rue de la République, Lyon"
        />
        {checking && (
          <p className="text-xs text-slate-500 flex items-center gap-1.5 animate-pulse mt-1 pl-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            Vérification de la couverture géographique...
          </p>
        )}
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1.5 animate-in slide-in-from-top-1 mt-1 pl-1">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            {error}
          </p>
        )}
        {!checking && !error && data.address && data.isAddressCovered && (
          <p className="text-xs text-emerald-600 flex items-center gap-1.5 animate-in slide-in-from-top-1 mt-1 pl-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Adresse couverte par nos techniciens.
          </p>
        )}
      </div>
    </div>
  )
}
