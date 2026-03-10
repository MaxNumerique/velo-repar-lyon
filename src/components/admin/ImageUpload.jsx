'use client'

import { Image as ImageIcon, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CldUploadWidget } from 'next-cloudinary'

export function ImageUpload({ value, onChange, label = "image", className = "aspect-video" }) {
  const onUpload = (result) => {
    onChange(result.info.secure_url)
  }

  return (
    <div className={`bg-slate-100 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group ${className}`}>
      {value ? (
        <>
          <img src={value} className="w-full h-full object-cover" alt="Uploaded" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <CldUploadWidget 
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
              onSuccess={onUpload}
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
            <Button 
                type="button" 
                variant="destructive" 
                size="sm"
                onClick={() => onChange('')}
            >
                <X className="w-4 h-4" />
            </Button>
          </div>
        </>
      ) : (
        <CldUploadWidget 
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          onSuccess={onUpload}
        >
          {({ open }) => (
            <button 
              type="button"
              onClick={() => open()}
              className="flex flex-col items-center gap-2 text-slate-400 hover:text-primary transition-colors"
            >
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">Ajouter une {label}</span>
            </button>
          )}
        </CldUploadWidget>
      )}
    </div>
  )
}
