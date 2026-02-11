import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export default async function DashboardPage() {
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
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Bienvenue, {user.firstName} 👋
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {user.role === 'ADMIN' ? 'Espace Administrateur' : 'Espace Technicien'} — Prêt pour de nouvelles interventions ?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Statut</h3>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {user.role === 'ADMIN' ? 'Admin Principal' : (user.technicianProfile?.isAvailable ? 'Disponible' : 'Indisponible')}
          </p>
        </div>
        {/* We can add more stats here later */}
      </div>
    </div>
  )
}
