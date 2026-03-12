'use client'

import { 
  Save, 
  Loader2, 
  Tag,
  Clock,
  Euro,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { showToast } from '@/lib/notifications'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { useAdminForm } from '@/hooks/use-admin-form'
import { FormLayout, FormSection, AdminLoading } from './FormShared'

const INITIAL_SERVICE = {
  title: '',
  description: '',
  price: '',
  duration_min: '',
  image: ''
}

export function ServiceForm({ id }) {
  const {
    formData,
    updateField,
    loading,
    saving,
    handleSubmit
  } = useAdminForm({
    id,
    basePath: '/api/admin/services',
    initialData: INITIAL_SERVICE,
    entityToast: showToast.service,
    redirectPath: '/admin/services'
  })

  if (loading) return <AdminLoading message="Chargement du forfait..." />

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <AdminHeader 
        title={id ? "Modifier le Forfait" : "Nouveau Forfait"}
        description={id ? `Mise à jour de la prestation #${id?.slice(-6)}` : "Ajoutez une prestation au catalogue"}
        backLink="/admin/services"
        icon={Tag}
      />

      <FormLayout onSubmit={handleSubmit}>
        <div className="lg:col-span-2 space-y-6">
          <FormSection title="Détails du Forfait" icon={Tag}>
            <div className="space-y-2">
              <Label htmlFor="title">Titre du forfait</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="title"
                  placeholder="ex: Révision Standard"
                  className="pl-9"
                  value={formData.title || ''}
                  onChange={e => updateField('title', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Prix (€)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9"
                    value={formData.price || ''}
                    onChange={e => updateField('price', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_min">Durée (min)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="duration_min"
                    type="number"
                    placeholder="30"
                    className="pl-9"
                    value={formData.duration_min || ''}
                    onChange={e => updateField('duration_min', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Textarea 
                  id="description"
                  placeholder="Détails de la prestation..."
                  className="min-h-[120px] pl-9"
                  value={formData.description || ''}
                  onChange={e => updateField('description', e.target.value)}
                  required
                />
              </div>
            </div>
          </FormSection>
        </div>

        <div className="space-y-6">
          <FormSection title="Image du Forfait" icon={Tag}>
            <ImageUpload 
              value={formData.image || ''}
              onChange={(url) => updateField('image', url)}
              label="image"
            />

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full gap-2 font-bold shadow-lg" 
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {id ? "Enregistrer" : "Créer le forfait"}
              </Button>
            </div>
          </FormSection>
        </div>
      </FormLayout>
    </div>
  )
}
