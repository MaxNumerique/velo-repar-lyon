'use client'

import { User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AddressAutocomplete from '@/components/admin/AddressAutocomplete'

export default function ClientInformationForm({ formData, updateForm, onLocationSelect }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Informations Client
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Prénom <span className="text-destructive">*</span></Label>
          <Input 
            required 
            placeholder="Jean"
            value={formData.clientFirstName}
            onChange={e => updateForm({ clientFirstName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Nom <span className="text-destructive">*</span></Label>
          <Input 
            required 
            placeholder="Dupont"
            value={formData.clientLastName}
            onChange={e => updateForm({ clientLastName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Téléphone <span className="text-destructive">*</span></Label>
          <Input 
            required 
            placeholder="06 12 34 56 78"
            value={formData.clientPhone}
            onChange={e => updateForm({ clientPhone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Email <span className="text-destructive">*</span></Label>
          <Input 
            type="email"
            required 
            placeholder="jean.dupont@exemple.com"
            value={formData.clientEmail}
            onChange={e => updateForm({ clientEmail: e.target.value })}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-xs">Adresse d'intervention (Lyon et environs) <span className="text-destructive">*</span></Label>
          <AddressAutocomplete
            value={formData.address}
            onChange={(val) => updateForm({ address: val })}
            onLocationSelect={onLocationSelect}
          />
        </div>
      </CardContent>
    </Card>
  )
}
