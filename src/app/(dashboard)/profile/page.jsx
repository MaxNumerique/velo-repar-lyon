import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function ProfilePage() {
  const clerkUser = await currentUser()
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: {
      technicianProfile: true,
      adminProfile: true,
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mon Profil</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gérez vos informations professionnelles.</p>
        </div>
        <Button variant="outline" size="sm" className="text-xs">Modifier</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Identité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">Nom Complet</span>
              <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">Email</span>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">Rôle</span>
              <p className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-block w-fit">
                {user.role}
              </p>
            </div>
          </CardContent>
        </Card>

        {user.role === 'TECHNICIAN' && (
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Informations Pro</CardTitle>
              <CardDescription className="text-xs">Visibles en ligne.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div>
                  <p className="text-sm font-bold">Disponibilité</p>
                  <p className="text-[10px] text-slate-500">Prêt pour interventions</p>
                </div>
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  user.technicianProfile?.isAvailable ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500"
                )} />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Zone</p>
                  <p className="text-sm font-medium">Lyon</p>
                </div>
                <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Transport</p>
                  <p className="text-sm font-medium">Vélo Cargo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
