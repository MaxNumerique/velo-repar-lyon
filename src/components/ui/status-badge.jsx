'use client'

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STATUS_CONFIG } from "@/features/interventions/constants"

export function StatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.SCHEDULED
  return (
    <Badge className={cn("text-[10px] uppercase font-bold tracking-wider", config.color, className)}>
      {config.label}
    </Badge>
  )
}
