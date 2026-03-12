import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import prisma from '@/lib/prisma'
import { upsertUser } from '@/lib/user-sync'

export const dynamic = 'force-dynamic'

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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar user={dbUser} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
