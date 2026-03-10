'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  ChevronLeft, 
  Save, 
  Loader2, 
  Tag,
  ImageIcon,
  Clock,
  Euro,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { showToast } from '@/lib/notifications'
import Link from 'next/link'
import { CldUploadWidget } from 'next-cloudinary'

export default function NewServicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration_min: '',
    image: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        showToast.service.created()
        router.push('/admin/services')
      } else {
        const error = await res.json()
        showToast.error(error.message || 'Erreur lors de la création')
      }
    } catch (error) {
      showToast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/services">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Nouveau Forfait</h1>
            <p className="text-xs text-slate-500">Ajoutez une prestation au catalogue</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" /> Détails du Forfait
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du forfait</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="title"
                    placeholder="ex: Révision Standard"
                    className="pl-9"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
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
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
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
                      value={formData.duration_min}
                      onChange={e => setFormData({...formData, duration_min: e.target.value})}
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
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" /> Image du Forfait
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
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

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full gap-2 font-bold shadow-lg" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Créer le forfait
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
