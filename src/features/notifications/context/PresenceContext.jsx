'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getPusherClient } from '@/lib/pusher'

const PresenceContext = createContext({
  onlineUserIds: new Set(),
})

export function PresenceProvider({ children, userId }) {
  const [onlineUserIds, setOnlineUserIds] = useState(new Set())
  useEffect(() => {
    if (!userId) return
    const pusher = getPusherClient()
    const channel = pusher.subscribe('presence-global-status')
    const handleUpdate = () => {
      const ids = new Set()
      channel.members.each((member) => ids.add(member.id))
      setOnlineUserIds(ids)
    }
    channel.bind('pusher:subscription_succeeded', handleUpdate)
    channel.bind('pusher:member_added', handleUpdate)
    channel.bind('pusher:member_removed', handleUpdate)
    return () => {
      pusher.unsubscribe('presence-global-status')
      channel.unbind_all()
    }
  }, [userId])
  return (
    <PresenceContext.Provider value={{ onlineUserIds }}>
      {children}
    </PresenceContext.Provider>
  )
}

export function usePresence() {
  const context = useContext(PresenceContext)
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider')
  }
  return context
}
