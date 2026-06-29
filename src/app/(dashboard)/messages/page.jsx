import { auth, currentUser } from '@clerk/nextjs/server'
import prisma from '@/db/prisma'
import ChatLayout from '@/features/chat/components/ChatLayout'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Messages | Vélo du Pélo',
  description: 'Messagerie instantanée pour vos interventions',
}

export default async function MessagesPage() {
  const { userId: clerkId } = await auth()
  
  if (!clerkId) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true
    }
  })

  if (!user) {
    redirect('/')
  }

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900">
      <ChatLayout user={user} />
    </div>
  )
}
