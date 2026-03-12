'use client'

import { Loader2 } from 'lucide-react'

/**
 * Reusable loading state for stepper components
 * @param {string} message - Optional custom message
 */
export function StepLoading({ message = "Chargement en cours..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in duration-500">
      <div className="relative">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
      </div>
      <p className="text-slate-500 font-medium text-sm tracking-tight">{message}</p>
    </div>
  )
}
