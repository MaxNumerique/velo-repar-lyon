'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Smile, X, FileIcon, ImageIcon } from 'lucide-react'
import { AdvancedImageUpload } from '@/components/shared/AdvancedImageUpload'
import EmojiPicker from 'emoji-picker-react'

export default function ChatInput({ onSend }) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef(null)
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

  const handleSend = () => {
    if (!content.trim() && attachments.length === 0) return
    onSend(content.trim(), attachments)
    setContent('')
    setAttachments([])
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
    }
  }

  const handleUpload = (result) => {
    const url = result.info.secure_url
    setAttachments(prev => [...prev, url])
  }

  const removeAttachment = (url) => {
    setAttachments(prev => prev.filter(a => a !== url))
  }

  const onEmojiClick = (emojiData) => {
    setContent(prev => prev + (emojiData.emoji || emojiData.native || ''))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e) => {
    const target = e.target
    target.style.height = 'auto'
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`
  }

  return (
    <div className="space-y-3">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
            {attachments.map((url) => {
                const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i)
                return (
                    <div key={url} className="relative group w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {isImage ? (
                            <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <FileIcon className="w-6 h-6 text-slate-400" />
                            </div>
                        )}
                        <button 
                            onClick={() => removeAttachment(url)}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )
            })}
        </div>
      )}

      <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 relative">
        <AdvancedImageUpload 
          onSuccess={handleUpload}
          variant="compact"
          multiple={true}
          maxFiles={5}
        />
        
        <textarea
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message..."
          className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 text-sm text-slate-800 dark:text-slate-200 min-h-[40px] max-h-[120px]"
        />
        
        <div className="relative" ref={emojiPickerRef}>
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            type="button"
            className={`p-2 transition-all duration-300 rounded-full ${showEmojiPicker ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-primary hover:bg-primary/5'}`}
          >
            <Smile className="w-5 h-5" />
          </button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-4 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  autoFocusSearch={false}
                  theme={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                  emojiStyle="twitter"
                  width={340}
                  height={400}
                  searchPlaceholder="Rechercher un emoji..."
                  previewConfig={{ showPreview: false }}
                  skinTonesDisabled
                  lazyLoadEmojis={true}
                  style={{
                    "--epr-bg-color": "transparent",
                    "--epr-category-label-bg-color": "transparent",
                    "--epr-hover-bg-color": "rgba(var(--primary), 0.1)",
                    "--epr-focus-bg-color": "rgba(var(--primary), 0.1)",
                    "--epr-highlight-color": "var(--primary)",
                    "--epr-search-border-color": "rgba(var(--primary), 0.2)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleSend}
          disabled={!content.trim() && attachments.length === 0}
          className={`p-2.5 rounded-xl transition-all duration-300 ${
            content.trim() || attachments.length > 0
              ? "bg-primary text-white shadow-lg shadow-primary/20 scale-100 hover:scale-105" 
              : "text-slate-300 cursor-not-allowed"
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
