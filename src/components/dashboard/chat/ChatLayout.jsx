'use client'

import { useState, useEffect } from 'react'
import ConversationList from './ConversationList'
import ChatWindow from './ChatWindow'
import { useSearchParams, useRouter } from 'next/navigation'
import { getPusherClient } from '@/lib/pusher'

export default function ChatLayout({ user }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedRequestId, setSelectedRequestId] = useState(searchParams.get('id'))
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [onlineUserIds, setOnlineUserIds] = useState(new Set())

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) setSelectedRequestId(id)
  }, [searchParams])

  useEffect(() => {
    const pusher = getPusherClient()
    const channel = pusher.subscribe('presence-global-status')

    const handleUpdate = () => {
        const ids = new Set()
        channel.members.each(member => ids.add(member.id))
        setOnlineUserIds(ids)
    }

    channel.bind('pusher:subscription_succeeded', handleUpdate)
    channel.bind('pusher:member_added', handleUpdate)
    channel.bind('pusher:member_removed', handleUpdate)

    return () => {
        pusher.unsubscribe('presence-global-status')
        channel.unbind_all()
    }
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations')
      const data = await res.json()
      setConversations(data)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = (requestId) => {
    setSelectedRequestId(requestId)
    router.push(`/messages?id=${requestId}`)
  }

  return (
    <div className="flex h-full bg-white dark:bg-slate-800 overflow-hidden">
      {/* Sidebar - Conversations List */}
      <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col ${selectedRequestId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ConversationList 
              conversations={conversations} 
              selectedRequestId={selectedRequestId}
              onSelect={handleSelectConversation}
              currentUser={user}
              onlineUserIds={onlineUserIds}
            />
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-900/30 ${!selectedRequestId ? 'hidden md:flex items-center justify-center p-8 text-center' : 'flex'}`}>
        {selectedRequestId ? (
          <ChatWindow 
            requestId={selectedRequestId} 
            currentUser={user}
            onBack={() => {
                setSelectedRequestId(null)
                router.push('/messages')
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
            </div>
            <div>
              <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Vos conversations</p>
              <p className="text-sm">Sélectionnez une discussion pour commencer à échanger</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
