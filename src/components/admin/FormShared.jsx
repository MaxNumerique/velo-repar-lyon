'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

/**
 * Standard section for admin forms
 */
export function FormSection({ title, icon: Icon, children, className }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  )
}

/**
 * Standard 2-column layout for admin forms
 */
export function FormLayout({ children, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {children}
    </form>
  )
}

/**
 * Standard loading state for admin pages
 */
export function AdminLoading({ message = "Chargement..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-20 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}
