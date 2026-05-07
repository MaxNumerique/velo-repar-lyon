import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUser, SignOutButton } from '@clerk/nextjs'
import ProfilePage from '../page'

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
  SignOutButton: vi.fn(({ children }) => <div data-testid="sign-out">{children}</div>)
}))

// Mock notifications
vi.mock('@/lib/notifications', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

// Mock global fetch
global.fetch = vi.fn()

describe('ProfilePage', () => {
    const mockClerkUser = {
        firstName: 'Jean',
        lastName: 'Dupont',
        primaryEmailAddress: { emailAddress: 'jean@test.com' },
        imageUrl: 'https://test.com/image.jpg'
    }

    const mockDbUser = {
        id: 'user-123',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean@test.com',
        phone: '0612345678',
        role: 'CLIENT'
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useUser).mockReturnValue({
            isLoaded: true,
            user: mockClerkUser
        })
        fetch.mockResolvedValue({
            ok: true,
            json: async () => mockDbUser
        })
    })

    it('affiche l\'état de chargement initial', () => {
        // Mock fetch to stay pending
        fetch.mockReturnValue(new Promise(() => {}))
        render(<ProfilePage />)
        expect(screen.getByText(/Chargement de votre profil/i)).toBeInTheDocument()
    })

    it('affiche les informations du profil client', async () => {
        render(<ProfilePage />)

        await waitFor(() => {
            expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument()
        })

        expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
        expect(screen.getByText('jean@test.com')).toBeInTheDocument()
        expect(screen.getByText('CLIENT')).toBeInTheDocument()
        expect(screen.getByText('0612345678')).toBeInTheDocument()
    })

    it('permet d\'entrer en mode édition et de modifier les champs', async () => {
        render(<ProfilePage />)
        await waitFor(() => screen.getByText('Modifier'))

        fireEvent.click(screen.getByText('Modifier'))

        const firstNameInput = screen.getByLabelText('Prénom')
        const lastNameInput = screen.getByLabelText('Nom')
        const phoneInput = screen.getByLabelText('Téléphone')

        fireEvent.change(firstNameInput, { target: { value: 'Alice' } })
        fireEvent.change(lastNameInput, { target: { value: 'Martin' } })
        fireEvent.change(phoneInput, { target: { value: '0600000000' } })

        expect(firstNameInput.value).toBe('Alice')
        expect(lastNameInput.value).toBe('Martin')
        expect(phoneInput.value).toBe('0600000000')
    })

    it('sauvegarde les modifications du profil', async () => {
        render(<ProfilePage />)
        await waitFor(() => screen.getByText('Modifier'))
        fireEvent.click(screen.getByText('Modifier'))

        fireEvent.change(screen.getByLabelText(/Prénom/i), { target: { value: 'Alice' } })
        
        const saveBtn = screen.getByText(/Enregistrer/i)
        
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ...mockDbUser, firstName: 'Alice' })
        })

        fireEvent.click(saveBtn)

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/admin/users/me', expect.objectContaining({
                method: 'PATCH',
                body: expect.stringContaining('"firstName":"Alice"')
            }))
        })

        expect(screen.queryByText(/Enregistrer/i)).not.toBeInTheDocument()
        expect(screen.getByText('Alice Dupont')).toBeInTheDocument()
    })

    it('affiche et gère la disponibilité pour un technicien', async () => {
        const technicianDbUser = {
            ...mockDbUser,
            role: 'TECHNICIAN',
            isAvailable: true
        }
        fetch.mockResolvedValue({
            ok: true,
            json: async () => technicianDbUser
        })

        render(<ProfilePage />)
        await waitFor(() => screen.getByText('Disponibilité'))

        expect(screen.getByText('Prêt à intervenir')).toBeInTheDocument()

        const switchElem = screen.getByRole('switch')
        
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ...technicianDbUser, isAvailable: false })
        })

        fireEvent.click(switchElem)

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/admin/users/me', expect.objectContaining({
                method: 'PATCH',
                body: expect.stringContaining('"isAvailable":false')
            }))
        })
    })

    it('permet d\'annuler les modifications', async () => {
        render(<ProfilePage />)
        await waitFor(() => screen.getByText('Modifier'))
        fireEvent.click(screen.getByText('Modifier'))

        fireEvent.change(screen.getByLabelText(/Prénom/i), { target: { value: 'Alice' } })
        
        fireEvent.click(screen.getByText(/Annuler/i))

        expect(screen.queryByLabelText(/Prénom/i)).not.toBeInTheDocument()
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    })
})
