'use client'

import { Image as  Plus, X } from 'lucide-react'
import { CldUploadWidget } from 'next-cloudinary'

export function MultiImageUpload({ 
  value = [], 
  onChange, 
  onRemove,
  label = "images", 
  maxImages = 5 
}) {
  const onUpload = (result) => {
    const url = result.info.secure_url
    onChange((prevValue) => {
      const current = Array.isArray(prevValue) ? prevValue : [];
      if (current.includes(url)) return current;
      return [...current, url];
    })
  }

  const handleRemove = (urlToRemove) => {
    onChange((prevValue) => {
      const current = Array.isArray(prevValue) ? prevValue : [];
      return current.filter((url) => url !== urlToRemove);
    })
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
          <CldUploadWidget 
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            onSuccess={onUpload}
            options={{
              maxFiles: maxImages,
              multiple: true,
              resourceType: "image",
              clientAllowedFormats: ["jpg", "png", "jpeg", "webp"]
            }}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-slate-400 hover:text-primary group"
              >
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
              </button>
            )}
          </CldUploadWidget>
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
