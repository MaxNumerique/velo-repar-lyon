'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ChevronLeft, 
  Save, 
  Loader2, 
  Package, 
  Image as ImageIcon,
  Tag,
  Euro,
  LayoutGrid
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import Link from 'next/link'
import { CldUploadWidget } from 'next-cloudinary'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    isActive: true
  })

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setFormData({
        name: data.name,
        description: data.description || '',
        price: data.price.toString(),
        category: data.category || 'Pièces',
        image: data.image || '',
        isActive: data.isActive
      })
    } catch (error) {
      showToast.error("Erreur lors du chargement du produit")
      router.push('/admin/products')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        showToast.success('Produit mis à jour')
        router.push('/admin/products')
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
        <p className="text-sm text-slate-500">Chargement du produit...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Modifier le Produit</h1>
            <p className="text-xs text-slate-500">Mise à jour de l'article #{id.slice(-6)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Détails du Produit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du produit</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="name"
                    className="pl-9"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
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
                      className="pl-9"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <div className="relative">
                    <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                    <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})}>
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
                <Textarea 
                  id="description"
                  className="min-h-[120px]"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" /> Image du Produit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                {formData.image ? (
                  <>
                    <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <CldUploadWidget 
                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                        onSuccess={(result) => setFormData({...formData, image: result.info.secure_url})}
                      >
                        {({ open }) => (
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm"
                            onClick={() => open()}
                          >
                            Changer
                          </Button>
                        )}
                      </CldUploadWidget>
                    </div>
                  </>
                ) : (
                  <CldUploadWidget 
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                    onSuccess={(result) => setFormData({...formData, image: result.info.secure_url})}
                  >
                    {({ open }) => (
                      <button 
                        type="button"
                        onClick={() => open()}
                        className="flex flex-col items-center gap-2 text-slate-400 hover:text-primary transition-colors"
                      >
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-xs">Ajouter une image</span>
                      </button>
                    )}
                  </CldUploadWidget>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="space-y-0.5">
                  <Label>Produit Actif</Label>
                  <p className="text-[10px] text-slate-500">Visible dans l'administration</p>
                </div>
                <Switch 
                  checked={formData.isActive}
                  onCheckedChange={val => setFormData({...formData, isActive: val})}
                />
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full gap-2 font-bold shadow-lg" 
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
