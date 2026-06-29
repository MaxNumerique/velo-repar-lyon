'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/dateUtils'
import { 
  Check, 
  CheckCheck, 
  FileIcon, 
  ExternalLink, 
  Pencil, 
  Trash2, 
  Smile, 
  MoreHorizontal,
  X,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import EmojiPicker from 'emoji-picker-react'

export default function MessageBubble({ 
  message, 
  isOwn, 
  currentUserId,
  onUpdate, 
  onDelete, 
  onReaction 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const time = formatTime(message.createdAt)
  const emojiPickerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleUpdate = () => {
    if (editContent.trim() && editContent !== message.content) {
      onUpdate(editContent)
    }
    setIsEditing(false)
  }

  const onEmojiClick = (emojiData) => {
    onReaction(emojiData.emoji)
    setShowEmojiPicker(false)
  }

  const reactions = Array.isArray(message.reactions) ? message.reactions : []

  if (message.isDeleted) {
    return (
      <div className={cn(
        "flex flex-col mb-4 max-w-[85%] md:max-w-[70%]",
        isOwn ? "ml-auto items-end" : "mr-auto items-start"
      )}>
        <div className={cn(
          "p-3 rounded-2xl text-xs italic border shadow-sm",
          isOwn 
            ? "bg-primary text-white/70 border-primary rounded-tr-none" 
            : "bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 rounded-tl-none"
        )}>
          {message.content || "Ce message a été supprimé"}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex flex-col mb-6 max-w-[85%] md:max-w-[70%] group relative",
      isOwn ? "ml-auto items-end" : "mr-auto items-start"
    )}>

      <div className={cn(
        "relative p-3 rounded-2xl shadow-sm text-sm transition-all duration-300",
        isOwn 
          ? "bg-primary text-white rounded-tr-none" 
          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700"
      )}>
        {!isEditing && (
            <div className={cn(
                "absolute -top-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex items-center bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-xl p-0.5",
                isOwn ? "left-0" : "right-0"
            )}>
                <div className="relative" ref={emojiPickerRef}>
                    <button 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
                        aria-label="Réagir"
                    >
                        <Smile className="w-4 h-4" />
                    </button>

                    {showEmojiPicker && (
                        <div className={cn(
                            "absolute bottom-full mb-2 z-50",
                            isOwn ? "right-0" : "left-0"
                        )}>
                            <div className="rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <EmojiPicker 
                                    onEmojiClick={onEmojiClick}
                                    autoFocusSearch={false}
                                    theme={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                                    emojiStyle="twitter"
                                    width={300}
                                    height={350}
                                    previewConfig={{ showPreview: false }}
                                    skinTonesDisabled
                                    lazyLoadEmojis={true}
                                />
                            </div>
                        </div>
                    )}
                </div>
                
                {isOwn && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors" aria-label="Plus d'options">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isOwn ? "end" : "start"} className="rounded-xl border-slate-200 dark:border-slate-700">
                            <DropdownMenuItem 
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 cursor-pointer rounded-lg"
                            >
                                <Pencil className="w-4 h-4" />
                                <span>Modifier</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={onDelete}
                                className="text-red-600 flex items-center gap-2 cursor-pointer rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Supprimer</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        )}
        {message.attachments?.length > 0 && (
          <div className="flex flex-col gap-2 mb-2 min-w-[150px]">
            {message.attachments.map((url, i) => {
              const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i)
              return (
                <div key={i} className="rounded-lg overflow-hidden border border-white/20">
                  {isImage ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="block relative group/img">
                      <img src={url} alt="Attachment" className="w-full h-auto max-h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-white" />
                      </div>
                    </a>
                  ) : (
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-2 p-2 transition-colors",
                        isOwn ? "bg-white/10 hover:bg-white/20" : "bg-slate-50 dark:bg-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <FileIcon className="w-4 h-4" />
                      <span className="text-[10px] font-medium truncate flex-1">Fichier joint</span>
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-2 min-w-[200px]">
            <textarea
              autoFocus
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleUpdate()
                }
                if (e.key === 'Escape') setIsEditing(false)
              }}
              className="w-full bg-black/10 dark:bg-white/10 border border-white/20 dark:border-slate-600 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/50 text-white dark:text-slate-200 resize-none"
              rows={Math.max(editContent.split('\n').length, 1)}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="p-1 px-2 hover:bg-black/10 rounded text-[10px] font-bold uppercase transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleUpdate}
                className="p-1 px-2 bg-white text-primary rounded text-[10px] font-bold uppercase transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}
        
        <div className={cn(
          "flex items-center gap-1.5 mt-1 justify-end",
          isOwn ? "text-primary-foreground/70" : "text-slate-400"
        )}>
          {message.isEdited && (
            <span className="text-[9px] font-medium opacity-50 italic">
              (modifié)
            </span>
          )}
          <span className="text-[10px] tabular-nums font-medium">{time}</span>
          {isOwn && time && (
            message.isRead 
              ? <CheckCheck className="w-3 h-3 text-blue-300" /> 
              : <Check className="w-3 h-3" />
          )}
        </div>

        {reactions.length > 0 && (
          <div className={cn(
            "absolute -bottom-3 flex flex-wrap gap-1 z-10 w-max max-w-[200px] md:max-w-xs",
            isOwn ? "right-0 justify-end" : "left-0 justify-start"
          )}>
            {reactions.map((reaction, i) => {
              const hasReacted = reaction.userIds.includes(currentUserId)
              return (
                <button
                  key={i}
                  onClick={() => onReaction(reaction.emoji)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs transition-all border shadow-sm whitespace-nowrap",
                    hasReacted 
                      ? "bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 scale-105" 
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <span>{reaction.emoji}</span>
                  {reaction.userIds.length > 1 && (
                    <span className="font-semibold text-[10px]">{reaction.userIds.length}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
