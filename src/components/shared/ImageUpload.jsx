'use client'

import { Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdvancedImageUpload } from '@/components/shared/AdvancedImageUpload'

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
            <div className="flex bg-white/10 p-2 rounded-2xl backdrop-blur-sm shadow-xl">
              <AdvancedImageUpload 
                onSuccess={onUpload} 
                className="grid-cols-2 !gap-1" 
              />
            </div>
            <Button 
                type="button" 
                variant="destructive" 
                size="sm"
                className="absolute top-2 right-2 rounded-full size-8"
                onClick={() => onChange('')}
            >
                <X className="w-4 h-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="p-8 w-full flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-1 text-slate-400">
                <ImageIcon className="w-8 h-8 opacity-20" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <AdvancedImageUpload onSuccess={onUpload} className="w-full max-w-xs" />
        </div>
      )}
    </div>
  )
}
