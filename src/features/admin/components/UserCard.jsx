'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Mail, 
  Phone, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  Edit2, 
  User as UserIcon,
  Shield,
  Wrench,
  MoreVertical
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'

const ROLE_CONFIG = {
  ADMIN: {
    label: "Administrateur",
    color: "bg-violet-500",
    light: "bg-violet-50",
    border: "border-violet-100",
    text: "text-violet-600",
    icon: Shield
  },
  TECHNICIAN: {
    label: "Technicien",
    color: "bg-blue-500",
    light: "bg-blue-50",
    border: "border-blue-100",
    text: "text-blue-600",
    icon: Wrench
  },
  CLIENT: {
    label: "Client",
    color: "bg-slate-600",
    light: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-600",
    icon: UserIcon
  }
}

function getUserDisplayName(user) {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) return user.firstName;
  return user.email.split('@')[0];
}

function getUserInitials(user) {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName[0].toUpperCase();
  }
  return user.email[0].toUpperCase();
}

export function UserCard({ 
  user, 
  onEdit, 
  onToggleBlock, 
  onDelete 
}) {
  const config = ROLE_CONFIG[user.role] || ROLE_CONFIG.CLIENT
  const Icon = config.icon
  const fullName = getUserDisplayName(user)
  const initials = getUserInitials(user)

  return (
    <Card className={cn(
      "group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl",
      user.isBlocked && "opacity-60 grayscale"
    )}>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className={cn(
              "md:w-48 p-6 flex flex-col justify-center items-center gap-2 text-center transition-colors duration-500 relative",
              config.light, config.text, "border-b md:border-b-0 md:border-r", config.border
          )}>
            <div className="bg-white dark:bg-slate-800 w-16 h-16 rounded-2xl shadow-sm group-hover:shadow-md transition-all flex items-center justify-center relative">
               <span className="text-xl font-black uppercase">
                 {initials}
               </span>
               <div className={cn(
                 "absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center text-white border-2 border-white dark:border-slate-800",
                 config.color
               )}>
                 <Icon className="w-3 h-3" />
               </div>
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest opacity-80 mt-2">
              {config.label}
            </span>
            {user.isBlocked && (
              <Badge className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full mt-2 border-none">
                BLOQUÉ
              </Badge>
            )}
          </div>
          <div className="flex-1 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none pt-1">
                  {fullName}
                </h4>
                <div className="flex flex-col gap-2 pt-3">
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold">{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full bg-slate-50 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                  onClick={() => onEdit(user)}
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full bg-slate-50 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                      title="Plus d'actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px] rounded-2xl border-none shadow-2xl p-2 bg-white dark:bg-slate-900 border border-slate-100">
                     <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions sur le compte</p>
                     <DropdownMenuItem onClick={() => onToggleBlock(user)} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer">
                        {user.isBlocked ? (
                          <>
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-emerald-600">Débloquer</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-bold text-amber-600">Bloquer l'accès</span>
                          </>
                        )}
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => onDelete(user)} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10">
                        <Trash2 className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-bold text-red-600">Supprimer définitivement</span>
                      </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-2">
               <span className="flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full", user.isBlocked ? "bg-red-400" : "bg-emerald-400")} />
                  {user.isBlocked ? "Compte Inactif / Bloqué" : "Compte Actif"}
               </span>
               {user.createdAt && (
                 <span>Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
               )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
