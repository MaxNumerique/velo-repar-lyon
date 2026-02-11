import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ticket, Calendar, MapPin, Tool } from 'lucide-react'

export default async function TicketsPage() {
  const clerkUser = await currentUser()
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: {
      technicianProfile: {
        include: {
          appointments: {
            include: {
              request: {
                include: {
                  user: true,
                  bike: true,
                  servicePackage: true,
                }
              }
            },
            orderBy: {
              scheduledAt: 'asc'
            }
          }
        }
      }
    }
  })

  const appointments = user.technicianProfile?.appointments || []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mes Tickets</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Suivez vos interventions à venir.</p>
      </div>

      <div className="space-y-3">
        {appointments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <div className="bg-slate-100 dark:bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Ticket className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold">Aucun ticket assigné</h3>
            <p className="text-xs text-slate-500 max-w-[200px] mx-auto mt-1">
              Dès qu'une demande vous sera attribuée, elle apparaîtra ici.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {appointments.map((appt) => (
              <Card key={appt.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    <div className="bg-primary/5 p-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-bold text-sm">
                          {new Date(appt.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(appt.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold",
                        appt.status === 'SCHEDULED' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                      )}>
                        {appt.status}
                      </span>
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                            {appt.request.servicePackage?.title || 'Réparation simple'}
                          </p>
                          <h4 className="text-base font-bold truncate">
                            {appt.request.user.firstName} {appt.request.user.lastName}
                          </h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Vélo</p>
                          <p className="font-medium text-xs">
                            {appt.request.bike?.brand} {appt.request.bike?.modelName}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{appt.request.address}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
