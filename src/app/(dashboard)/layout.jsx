import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import prisma from '@/lib/prisma'
import { upsertUser } from '@/lib/user-sync'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }) {
  const clerkUser = await currentUser()
  if (!clerkUser) redirect('/sign-in')

  let dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true, firstName: true, role: true }
  })

  if (!dbUser) {
    // Sync user if they exist in Clerk but not in DB
    dbUser = await upsertUser(clerkUser)
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar user={dbUser} />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
