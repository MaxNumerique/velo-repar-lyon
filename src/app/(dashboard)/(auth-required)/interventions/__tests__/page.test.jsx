import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUser } from '@clerk/nextjs'
import UserInterventionsPage from '../page'

// Mocks
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
}))

// Mock UI components that might be complex or use context we don't want to mock fully
vi.mock('@/components/dashboard/InterventionDetails', () => ({
  InterventionDetails: () => <div data-testid="intervention-details" />
}))

// Mock global fetch
global.fetch = vi.fn()

describe('UserInterventionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockInterventions = [
    {
      id: '1',
      address: '123 Rue de la Paix',
      clientFirstName: 'Jean',
      clientLastName: 'Dupont',
      status: 'SCHEDULED'
    }
  ]

  describe('Rôle Client', () => {
    beforeEach(() => {
      vi.mocked(useUser).mockReturnValue({
        isLoaded: true,
        user: {
          publicMetadata: { role: 'CLIENT' },
          firstName: 'Jean',
          lastName: 'Dupont'
        }
      })
    })

    it('affiche le titre "Mes Demandes" pour un client', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })

      render(<UserInterventionsPage />)
      
      expect(screen.getByText('Mes Demandes')).toBeInTheDocument()
    })

    it('affiche le message "Aucune demande trouvée" si la liste est vide', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })

      render(<UserInterventionsPage />)

      await waitFor(() => {
        expect(screen.getByText('Aucune demande trouvée')).toBeInTheDocument()
      })
      expect(screen.getByText('Créer ma première demande')).toBeInTheDocument()
    })

    it('affiche la liste des interventions', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInterventions
      })

      render(<UserInterventionsPage />)

      await waitFor(() => {
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
        expect(screen.getByText('123 Rue de la Paix')).toBeInTheDocument()
      })
    })

    it('permet d\'annuler une intervention', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInterventions
      })
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      render(<UserInterventionsPage />)

      const cancelBtn = await screen.findByText('Annuler')
      fireEvent.click(cancelBtn)

      // The modal should appear. We look for the confirm button.
      const confirmBtn = screen.getByText('Confirmer l\'annulation')
      fireEvent.click(confirmBtn)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/interventions/1'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })

  describe('Rôle Technicien', () => {
    beforeEach(() => {
      vi.mocked(useUser).mockReturnValue({
        isLoaded: true,
        user: {
          publicMetadata: { role: 'TECHNICIAN' },
          id: 'tech_1'
        }
      })
    })

    it('affiche le titre "Mes Interventions" pour un technicien', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })

      render(<UserInterventionsPage />)
      
      expect(screen.getByText('Mes Interventions')).toBeInTheDocument()
    })

    it('affiche le bouton "En route" pour une intervention planifiée', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInterventions
      })

      render(<UserInterventionsPage />)

      await waitFor(() => {
        expect(screen.getByText('En route')).toBeInTheDocument()
      })
    })

    it('appelle l\'API lors du clic sur "En route"', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInterventions
      })
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockInterventions[0], status: 'EN_ROUTE' })
      })

      render(<UserInterventionsPage />)

      const enRouteBtn = await screen.findByText('En route')
      fireEvent.click(enRouteBtn)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/interventions/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'EN_ROUTE' })
        })
      )
    })
  })
})
