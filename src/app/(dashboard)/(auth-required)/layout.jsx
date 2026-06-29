import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function AuthRequiredLayout({ children }) {
  const clerkUser = await currentUser()
  if (!clerkUser) redirect('/sign-in')
  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  )
}
