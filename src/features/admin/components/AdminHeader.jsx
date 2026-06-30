'use client'

import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function AdminHeader({
  title,
  description,
  backLink,
  icon: Icon,
  action,
  hideDescriptionMobile = false,
  uppercase = false,
}) {
  return (
    <div className="flex items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {backLink && (
          <Link href={backLink} className="shrink-0">
            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 md:w-10 md:h-10 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </Button>
          </Link>
        )}
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              {title}
            </h1>
            {description && (
              <p className={cn(
                "text-slate-500",
                uppercase ? "uppercase tracking-wider font-medium text-[10px] md:text-xs" : "text-xs mt-0.5",
                hideDescriptionMobile && "hidden md:block"
              )}>
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      {action && (
        <div className="shrink-0 flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  )
}
