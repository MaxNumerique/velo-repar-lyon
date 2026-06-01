'use client'

import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { usePresence } from '@/stores/presence'

export default function ConversationList({ conversations, selectedRequestId, onSelect, currentUser }) {
  const { onlineUserIds } = usePresence()
  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Aucune conversation en cours
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
      {conversations.map((conv) => {
        const lastMessage = conv.messages[0]
        const isSelected = selectedRequestId === conv.requestId
        
        let displayName = "Inconnu"
        if (currentUser.role === 'TECHNICIAN') {
            displayName = `${conv.request?.user?.firstName || 'Client'} ${conv.request?.user?.lastName || ''}`
        } else {
            const tech = conv.request?.technician
            displayName = tech ? `${tech.firstName} ${tech.lastName}` : "Technicien en attente"
        }

        let otherUserId;
        if (currentUser.role === 'TECHNICIAN') {
          otherUserId = conv.request?.userId;
        } else {
          otherUserId = conv.request?.technicianId;
        }
        const isOnline = otherUserId ? onlineUserIds.has(otherUserId) : false;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.requestId)}
            className={cn(
              "w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
              isSelected && "bg-primary/5 dark:bg-primary/10 border-r-4 border-primary"
            )}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold text-lg">
              {displayName.charAt(0)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className={cn(
                  "font-semibold truncate flex items-center gap-1.5",
                  isSelected ? "text-primary" : "text-slate-900 dark:text-white"
                )}>
                  {displayName}
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-500",
                    isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-slate-300 dark:bg-slate-600"
                  )} />
                </h3>
                {lastMessage && (
                  <span className="text-[10px] text-slate-400">
                    {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false, locale: fr })}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {lastMessage ? lastMessage.content : "Nouvelle conversation"}
              </p>
              
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 uppercase tracking-tighter">
                  Intervention #{conv.requestId.slice(-4)}
                </span>
                {lastMessage && !lastMessage.isRead && lastMessage.senderId !== currentUser.id && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
