'use client'

import { 
  Save, 
  Loader2, 
  Package, 
  Tag,
  Euro,
  LayoutGrid,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from '@/components/ui/switch'
import { showToast } from '@/lib/notifications'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { AdminHeader } from '@/features/admin/components/AdminHeader'
import { useAdminForm } from '@/features/admin/hooks/useAdminForm'
import { FormLayout, FormSection, AdminLoading } from '../FormShared'

const INITIAL_PRODUCT = {
  name: '',
  description: '',
  price: '',
  category: 'Pièces',
  image: '',
  isActive: true
}

export function ProductForm({ id }) {
  const {
    formData,
    updateField,
    loading,
    saving,
    handleSubmit
  } = useAdminForm({
    id,
    basePath: '/api/admin/products',
    initialData: INITIAL_PRODUCT,
    entityToast: showToast.product,
    redirectPath: '/admin/products'
  })

  if (loading) return <AdminLoading message="Chargement du produit..." />

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <AdminHeader 
        title={id ? "Modifier le Produit" : "Nouveau Produit"}
        description={id ? `Mise à jour de l'article #${id?.slice(-6)}` : "Ajoutez un article au catalogue"}
        backLink="/admin/products"
        icon={Package}
      />
      <FormLayout onSubmit={handleSubmit}>
        <div className="lg:col-span-2 space-y-6">
          <FormSection title="Détails du Produit" icon={Package}>
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="name"
                  placeholder="ex: Plaquettes de frein Shimano"
                  className="pl-9"
                  value={formData.name || ''}
                  onChange={e => updateField('name', e.target.value)}
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
                <Label htmlFor="category">Catégorie</Label>
                <div className="relative">
                  <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                  <Select 
                    value={formData.category || 'Pièces'} 
                    onValueChange={val => updateField('category', val)}
                  >
                    <SelectTrigger className="pl-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pièces">Pièces</SelectItem>
                      <SelectItem value="Accessoires">Accessoires</SelectItem>
                      <SelectItem value="Consommables">Consommables</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Textarea 
                      id="description"
                      placeholder="Détails techniques, compatibilité..."
                      className="min-h-[120px] pl-9"
                      value={formData.description || ''}
                      onChange={e => updateField('description', e.target.value)}
                  />
              </div>
            </div>
          </FormSection>
        </div>
        <div className="space-y-6">
          <FormSection title="Image du Produit" icon={Package}>
            <ImageUpload 
              value={formData.image || ''}
              onChange={(url) => updateField('image', url)}
              label="image"
              className="aspect-square"
            />
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <Label>Produit Actif</Label>
                <p className="text-[10px] text-slate-500">Visible dans l'administration</p>
              </div>
              <Switch 
                checked={formData.isActive ?? true}
                onCheckedChange={val => updateField('isActive', val)}
              />
            </div>
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full gap-2 font-bold shadow-lg" 
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {id ? "Enregistrer" : "Créer le produit"}
              </Button>
            </div>
          </FormSection>
        </div>
      </FormLayout>
    </div>
  )
}
