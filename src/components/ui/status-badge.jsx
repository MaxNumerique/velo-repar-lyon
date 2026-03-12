'use client'

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STATUS_CONFIG } from "@/lib/intervention-utils"

/**
 * Reusable Status Badge component
 * @param {string} status - The status code (SCHEDULED, EN_ROUTE, ...)
 * @param {string} className - Optional extra classes
 */
export function StatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.SCHEDULED
  
  return (
    <Badge className={cn("text-[10px] uppercase font-bold tracking-wider", config.color, className)}>
      {config.label}
    </Badge>
  )
}
