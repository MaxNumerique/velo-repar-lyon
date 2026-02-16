'use client'

import { useState, useEffect } from 'react'
import { SignOutButton, useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2, User as UserIcon } from 'lucide-react'

export default function ProfilePage() {
  const { user: clerkUser, isLoaded } = useUser()
  const [dbUser, setDbUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && clerkUser) {
      fetch('/api/admin/users/me')
        .then(res => res.json())
        .then(data => {
          setDbUser(data)
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [isLoaded, clerkUser])

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Chargement de votre profil...</p>
      </div>
    )
  }

  const user = dbUser || {
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    role: 'CLIENT'
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mon Profil</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gérez vos informations personnelles et votre compte.</p>
        </div>
        <Button variant="outline" size="sm" className="text-xs">Modifier</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1 shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5" />
          <div className="px-6 -mt-10 pb-6">
            <div className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden shadow-lg mb-4 bg-white dark:bg-slate-700 flex items-center justify-center">
               {clerkUser.imageUrl ? (
                 <img src={clerkUser.imageUrl} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <UserIcon className="w-10 h-10 text-slate-300" />
               )}
            </div>
            <h3 className="font-bold text-lg">{user.firstName} {user.lastName}</h3>
            <p className="text-xs text-slate-500 truncate mb-4">{user.email}</p>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
              {user.role}
            </span>
          </div>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Paramètres du compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1">
                 <p className="text-xs text-slate-500">Besoin de quitter votre session ? Les données de votre compte seront préservées pour votre prochaine connexion.</p>
              </div>
              
              <SignOutButton redirectUrl="/">
                <Button variant="destructive" className="w-full md:w-auto gap-2 font-bold shadow-lg shadow-red-500/20">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </Button>
              </SignOutButton>
            </CardContent>
          </Card>

          {user.role === 'TECHNICIAN' && user.technicianProfile && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Informations Professionnelles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <p className="text-sm font-bold">Statut de disponibilité</p>
                    <p className="text-[10px] text-slate-500">Gérez si vous êtes prêt à recevoir des interventions</p>
                  </div>
                  <div className={cn(
                    "w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]",
                    user.technicianProfile.isAvailable ? "bg-green-500 shadow-green-500/50" : "bg-red-500 shadow-red-500/50"
                  )} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
