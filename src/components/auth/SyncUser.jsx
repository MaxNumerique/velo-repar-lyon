import { currentUser } from '@clerk/nextjs/server'
import { upsertUser } from '@/lib/user-sync'

export default async function SyncUser() {
  const user = await currentUser()
  
  if (user) {
    await upsertUser(user)
  }

  return null
}
