import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ChatLayout from '@/components/dashboard/chat/ChatLayout'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePresence } from '@/components/providers/PresenceProvider'
import { getPusherClient } from '@/lib/pusher'

// Mock next/navigation
const mockRouter = {
  push: vi.fn(),
}
const mockSearchParams = {
  get: vi.fn(),
}
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => mockRouter,
}))

// Mock presence
vi.mock('@/components/providers/PresenceProvider', () => ({
  usePresence: vi.fn(),
}))

// Mock Pusher
const mockChannel = {
  subscribe: vi.fn().mockReturnThis(),
  bind: vi.fn(),
  unbind_all: vi.fn(),
}
vi.mock('@/lib/pusher', () => ({
  getPusherClient: vi.fn(() => ({
    subscribe: vi.fn(() => mockChannel),
    unsubscribe: vi.fn(),
  })),
}))

// Mock dependencies that cause issues in JSDOM
vi.mock('emoji-picker-react', () => ({
    default: () => <div data-testid="emoji-picker" />
}))
vi.mock('@/components/shared/AdvancedImageUpload', () => ({
    AdvancedImageUpload: () => <div data-testid="image-upload" />
}))
vi.mock('../InterventionDetails', () => ({
    InterventionDetails: () => <div data-testid="intervention-details" />
}))

// Mock global fetch
global.fetch = vi.fn()

describe('ChatLayout', () => {
    const mockUser = {
        id: 'user-1',
        firstName: 'Jean',
        lastName: 'Technicien',
        role: 'TECHNICIAN'
    }

    const mockConversations = [
        {
            id: 'conv-1',
            requestId: 'req-1',
            messages: [{
                id: 'msg-1',
                content: 'Bonjour',
                createdAt: new Date().toISOString(),
                senderId: 'client-1'
            }],
            request: {
                id: 'req-1',
                userId: 'client-1',
                user: { id: 'client-1', firstName: 'Alice', lastName: 'Client' },
                appointment: {
                    technician: { user: { id: 'user-1' } }
                }
            }
        }
    ]

    const mockMessages = [
        {
            id: 'msg-1',
            content: 'Bonjour',
            senderId: 'client-1',
            createdAt: new Date().toISOString(),
            reactions: []
        }
    ]

    beforeEach(() => {
        vi.clearAllMocks()
        mockSearchParams.get.mockReturnValue(null)
        vi.mocked(usePresence).mockReturnValue({ onlineUserIds: new Set() })
        
        fetch.mockImplementation((url) => {
            if (url === '/api/conversations') {
                return Promise.resolve({ ok: true, json: async () => mockConversations })
            }
            if (url.includes('/api/conversations/req-1/messages')) {
                 return Promise.resolve({ ok: true, json: async () => mockMessages })
            }
            if (url.includes('/api/interventions/')) {
                return Promise.resolve({ ok: true, json: async () => mockConversations[0].request })
            }
            return Promise.resolve({ ok: true, json: async () => ({}) })
        })
    })

    it('affiche l\'état initial de la messagerie', async () => {
        render(<ChatLayout user={mockUser} />)
        
        expect(screen.getByText('Messages')).toBeInTheDocument()
        
        await waitFor(() => {
            expect(screen.getByText('Alice Client')).toBeInTheDocument()
        })

        expect(screen.getByText('Vos conversations')).toBeInTheDocument()
    })

    it('permet de sélectionner une conversation', async () => {
        render(<ChatLayout user={mockUser} />)
        
        const convItem = await screen.findByText('Alice Client')
        fireEvent.click(convItem)

        expect(mockRouter.push).toHaveBeenCalledWith('/messages?id=req-1')
    })

    it('affiche la fenêtre de chat quand un ID est présent dans l\'URL', async () => {
        mockSearchParams.get.mockReturnValue('req-1')
        
        render(<ChatLayout user={mockUser} />)

        await waitFor(() => {
            const messages = screen.getAllByText(/Bonjour/i)
            expect(messages.length).toBeGreaterThan(0)
        })
        
        expect(screen.queryByText('Vos conversations')).not.toBeInTheDocument()
    })

    it('permet d\'envoyer un message', async () => {
        mockSearchParams.get.mockReturnValue('req-1')
        render(<ChatLayout user={mockUser} />)

        const input = await screen.findByPlaceholderText(/Écrivez votre message/i)
        fireEvent.change(input, { target: { value: 'Salut Alice' } })
        
        const sendBtn = screen.getByLabelText('Envoyer')
        
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 'msg-2',
                content: 'Salut Alice',
                senderId: 'user-1',
                createdAt: new Date().toISOString(),
                reactions: []
            })
        })

        fireEvent.click(sendBtn)

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/conversations/req-1/messages'),
                expect.objectContaining({ method: 'POST' })
            )
        })
    })

    it('réagit aux événements Pusher en temps réel', async () => {
        mockSearchParams.get.mockReturnValue('req-1')
        
        // Capture the bind callback
        let newMessageCallback
        mockChannel.bind.mockImplementation((event, cb) => {
            if (event === 'new-message') newMessageCallback = cb
        })

        render(<ChatLayout user={mockUser} />)

        // Simulate incoming message
        const incomingMsg = {
            id: 'msg-pulse',
            content: 'Message en direct',
            senderId: 'client-1',
            createdAt: new Date().toISOString(),
            reactions: []
        }

        // Wait for Pusher to be bound
        await waitFor(() => expect(newMessageCallback).toBeDefined())
        newMessageCallback(incomingMsg)

        expect(await screen.findByText('Message en direct')).toBeInTheDocument()
    })

    it('affiche le statut en ligne de l\'interlocuteur', async () => {
        mockSearchParams.get.mockReturnValue('req-1')
        vi.mocked(usePresence).mockReturnValue({ onlineUserIds: new Set(['client-1']) })

        render(<ChatLayout user={mockUser} />)

        await waitFor(() => {
            expect(screen.queryByText(/En ligne/i)).toBeInTheDocument()
        }, { timeout: 5000 })
    })
})
