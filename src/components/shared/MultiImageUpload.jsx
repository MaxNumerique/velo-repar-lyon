'use client'

import { Plus, X } from 'lucide-react'
import { AdvancedImageUpload } from '@/components/shared/AdvancedImageUpload'

export function MultiImageUpload({ 
  value = [], 
  onChange, 
  onRemove,
  label = "images", 
  maxImages = 5 
}) {
  const onUpload = (result) => {
    const url = result.info.secure_url
    const newValue = [...value, url]
    onChange(newValue)
  }

  const handleRemove = (urlToRemove) => {
    const newValue = value.filter((url) => url !== urlToRemove)
    onChange(newValue)
  }

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {value.map((url) => (
          <div 
            key={url} 
            className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group"
          >
            <img 
              src={url} 
              alt="Upload" 
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" 
            />
            <button
              onClick={() => handleRemove(url)}
              type="button"
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <div className="col-span-1">
            <AdvancedImageUpload 
              onSuccess={onUpload} 
              multiple={true}
              maxFiles={maxImages - value.length}
              label={label}
              className="grid-cols-1 !gap-2 h-full"
            />
          </div>
        )}
      </div>
      
      {value.length > 0 && (
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
          {value.length} / {maxImages} {label} ajoutée{value.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
