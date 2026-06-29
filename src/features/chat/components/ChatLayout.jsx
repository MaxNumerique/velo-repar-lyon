'use client'

import ConversationList from './ConversationList'
import ChatWindow from './ChatWindow'
import { Loader2 } from 'lucide-react'
import { ChatProvider, useChat } from '@/features/chat/context/ChatContext'

export default function ChatLayout({ user }) {
  return (
    <ChatProvider>
      <ChatLayoutContent user={user} />
    </ChatProvider>
  )
}

function ChatLayoutContent({ user }) {
  const {
    conversations,
    conversationsLoading: loading,
    selectedRequestId,
    selectConversation
  } = useChat()

  return (
    <div className="flex h-full bg-white dark:bg-slate-800 overflow-hidden">
      <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col ${selectedRequestId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <ConversationList currentUser={user} />
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-900/30 ${!selectedRequestId ? 'hidden md:flex items-center justify-center p-8 text-center' : 'flex'}`}>
        {selectedRequestId ? (
          <ChatWindow currentUser={user} />
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
