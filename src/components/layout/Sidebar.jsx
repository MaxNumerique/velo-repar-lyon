'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import { 
  User, 
  Users,
  Ticket, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Tag,
  Map,
  Package,
  MessageSquare,
  Bike,
  Wrench
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Sidebar({ user }) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  if (!user) return null;
  const isAdmin = user?.role === 'ADMIN'
  const isTechnician = user?.role === 'TECHNICIAN'
  const isClient = user?.role === 'CLIENT'
  const navItems = [
    {
      title: 'Interventions',
      href: isAdmin ? '/admin/interventions' : '/interventions',
      icon: Ticket,
    },
    {
      title: 'Mon Profil',
      href: '/profile',
      icon: User,
    },
  ]
  if (isAdmin) {
    navItems.push({
      title: 'Utilisateurs',
      href: '/admin/users',
      icon: Users,
    }, {
      title: 'Catalogue',
      href: '/admin/products',
      icon: Package,
    }, {
      title: 'Forfaits',
      href: '/admin/services',
      icon: Tag,
    }, {
      title: 'Secteurs',
      href: '/admin/sectors',
      icon: Map,
    })
  }
  navItems.push({
    title: 'Messages',
    href: '/messages',
    icon: MessageSquare,
  })
  if (isTechnician) {
    if (!navItems.find(item => item.href === '/map')) {
        navItems.splice(1, 0, {
            title: 'Carte',
            href: '/map',
            icon: Map,
        })
    }
  }
  if (isClient) {
    if (!navItems.find(item => item.href === '/repair')) {
      navItems.splice(0, 0, {
        title: 'Nouvelle Réparation',
        href: '/repair',
        icon: Wrench,
      })
      navItems.splice(2, 0, {
        title: 'Mes Vélos',
        href: '/bikes',
        icon: Bike,
      })
    }
  }

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.slice(0, 6).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors min-w-0",
              pathname === item.href 
                ? "text-primary" 
                : "text-slate-400"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
          </Link>
        ))}
      </nav>
      <aside 
        className={cn(
          "hidden md:flex bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col transition-all duration-300 relative sticky top-0 h-screen z-40",
          isExpanded ? "w-58" : "w-20"
        )}
      >
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-20 bg-primary text-white rounded-full p-1 shadow-lg border-2 border-white dark:border-slate-900 z-50 hover:scale-110 transition-transform"
          aria-label={isExpanded ? "Réduire le menu" : "Étendre le menu"}
        >
          {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className={cn("h-24 border-b border-slate-200 dark:border-slate-700 flex items-center justify-center p-4 flex-shrink-0")}>
          <Link href="/" className="flex items-center justify-center overflow-hidden">
            <Image 
              src="/velodupelo.png" 
              alt="Vélo du Pélo" 
              width={isExpanded ? 84 : 48} 
              height={isExpanded ? 84 : 48} 
              className="flex-shrink-0 transition-all duration-300"
            />
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors relative group",
                pathname === item.href 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700",
                !isExpanded && "justify-center"
              )}
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              {isExpanded && <span className="whitespace-nowrap transition-opacity duration-200">{item.title}</span>}
              {!isExpanded && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all whitespace-nowrap z-[200]">
                  {item.title}
                </div>
              )}
            </Link>
          ))}
        </nav>
        <div className={cn("p-3 border-t border-slate-200 dark:border-slate-700 mt-auto", !isExpanded && "flex flex-col items-center")}>
          <SignOutButton redirectUrl="/">
            <button className={cn(
              "flex items-center gap-3 px-3 py-3 w-full rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors group relative",
              !isExpanded && "justify-center"
            )}>
              <LogOut className="w-6 h-6 flex-shrink-0" />
              {isExpanded && <span className="whitespace-nowrap transition-opacity duration-200">Déconnexion</span>}
              
              {!isExpanded && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-red-500 text-white text-xs rounded opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all whitespace-nowrap z-[100]">
                  Déconnexion
                </div>
              )}
            </button>
          </SignOutButton>
        </div>
      </aside>
    </>
  )
}
