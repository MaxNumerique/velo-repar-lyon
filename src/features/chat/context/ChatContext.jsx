'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getPusherClient } from '@/lib/pusher'
import {
  getConversations,
  getChatMessages,
  getIntervention,
  sendChatMessage,
  updateChatMessage,
  deleteChatMessage,
  toggleChatReaction
} from '@/features/chat/services/chatService'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [conversations, setConversations] = useState([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [selectedRequestId, setSelectedRequestId] = useState(searchParams.get('id'))
  
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [intervention, setIntervention] = useState(null)

  useEffect(() => {
    const id = searchParams.get('id')
    setSelectedRequestId(id)
  }, [searchParams])

  useEffect(() => {
    const loadConversations = async () => {
      setConversationsLoading(true)
      try {
        const data = await getConversations()
        setConversations(data)
      } catch (err) {
        console.error('Failed to fetch conversations:', err)
      } finally {
        setConversationsLoading(false)
      }
    }
    loadConversations()
  }, [])

  useEffect(() => {
    if (!selectedRequestId) {
      setMessages([])
      setConversation(null)
      setIntervention(null)
      return
    }

    const loadChatData = async () => {
      setMessagesLoading(true)
      try {
        const [msgs, interv] = await Promise.all([
          getChatMessages(selectedRequestId),
          getIntervention(selectedRequestId)
        ])
        setMessages(msgs)
        setIntervention(interv)

        const conv = conversations.find((c) => c.requestId === selectedRequestId)
        setConversation(conv || null)
      } catch (err) {
        console.error('Failed to load chat data:', err)
      } finally {
        setMessagesLoading(false)
      }
    }

    loadChatData()
  }, [selectedRequestId, conversations])

  useEffect(() => {
    if (!selectedRequestId || !conversation) return

    const pusher = getPusherClient()
    const channelName = `presence-conversation-${selectedRequestId}`
    const channel = pusher.subscribe(channelName)

    const handleNewMessage = (newMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev
        return [...prev, newMessage]
      })

      setConversations((prevConvs) =>
        prevConvs.map((c) => {
          if (c.requestId === selectedRequestId) {
            return {
              ...c,
              messages: [newMessage, ...c.messages.filter((m) => m.id !== newMessage.id)]
            }
          }
          return c
        })
      )
    }

    const handleMessageUpdated = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
      )

      setConversations((prevConvs) =>
        prevConvs.map((c) => {
          if (c.requestId === selectedRequestId) {
            return {
              ...c,
              messages: c.messages.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
            }
          }
          return c
        })
      )
    }

    channel.bind('new-message', handleNewMessage)
    channel.bind('message-updated', handleMessageUpdated)

    return () => {
      pusher.unsubscribe(channelName)
      channel.unbind_all()
    }
  }, [selectedRequestId, conversation])

  const selectConversation = (id) => {
    setSelectedRequestId(id)
    if (id) {
      router.push(`/messages?id=${id}`)
    } else {
      router.push('/messages')
    }
  }

  const sendMessage = async (content, attachments = []) => {
    if (!selectedRequestId) return
    try {
      const newMessage = await sendChatMessage(selectedRequestId, content, attachments)
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev
        return [...prev, newMessage]
      })
      
      setConversations((prevConvs) =>
        prevConvs.map((c) => {
          if (c.requestId === selectedRequestId) {
            return {
              ...c,
              messages: [newMessage, ...c.messages.filter((m) => m.id !== newMessage.id)]
            }
          }
          return c
        })
      )
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const updateMessage = async (messageId, content) => {
    if (!selectedRequestId) return
    try {
      const updatedMessage = await updateChatMessage(selectedRequestId, messageId, content)
      setMessages((prev) =>
        prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
      )
      
      setConversations((prevConvs) =>
        prevConvs.map((c) => {
          if (c.requestId === selectedRequestId) {
            return {
              ...c,
              messages: c.messages.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
            }
          }
          return c
        })
      )
    } catch (error) {
      console.error('Error updating message:', error)
    }
  }

  const deleteMessage = async (messageId) => {
    if (!selectedRequestId) return
    try {
      const updatedMessage = await deleteChatMessage(selectedRequestId, messageId)
      setMessages((prev) =>
        prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
      )
      
      setConversations((prevConvs) =>
        prevConvs.map((c) => {
          if (c.requestId === selectedRequestId) {
            return {
              ...c,
              messages: c.messages.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
            }
          }
          return c
        })
      )
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const toggleReaction = async (messageId, emoji) => {
    if (!selectedRequestId) return
    try {
      const updatedMessage = await toggleChatReaction(selectedRequestId, messageId, emoji)
      setMessages((prev) =>
        prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
      )
    } catch (error) {
      console.error('Error toggling reaction:', error)
    }
  }

  const value = {
    conversations,
    conversationsLoading,
    selectedRequestId,
    selectConversation,
    messages,
    messagesLoading,
    conversation,
    intervention,
    sendMessage,
    updateMessage,
    deleteMessage,
    toggleReaction
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
