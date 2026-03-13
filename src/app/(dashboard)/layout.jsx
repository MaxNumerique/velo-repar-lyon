import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { PresenceProvider } from '@/components/providers/PresenceProvider'
import Sidebar from '@/components/dashboard/Sidebar'
import prisma from '@/lib/prisma'

export default async function DashboardLayout({ children }) {
  const clerkUser = await currentUser()
  let dbUser = null;
  if (clerkUser) {
    dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true, firstName: true, role: true }
    })

    if (!dbUser) {
      // Sync user if they exist in Clerk but not in DB
      dbUser = await upsertUser(clerkUser)
    }
  }

  return (
    <PresenceProvider userId={dbUser?.id}>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
        <Sidebar user={dbUser} />
        <main className="flex-1 min-w-0 relative h-full">
          <div className="absolute inset-0 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </PresenceProvider>
  )
}
