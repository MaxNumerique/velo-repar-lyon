import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AdminServicesPage from '../page'

// Mock global fetch
global.fetch = vi.fn()

// Mock showToast
vi.mock('@/lib/notifications', () => ({
  showToast: {
    service: {
      deleted: vi.fn(),
      error: vi.fn()
    }
  }
}))

// Mock DropdownMenu to render content in-line
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div data-testid="dropdown">{children}</div>,
  DropdownMenuTrigger: ({ children }) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick, className }) => (
    <div onClick={onClick} className={className} role="menuitem">{children}</div>
  ),
}))

describe('AdminServicesPage', () => {
  const mockServices = [
    { id: '1', title: 'Révision Urbaine', description: 'Contrôle complet de votre vélo de ville.', price: 45, duration_min: 60, image: null },
    { id: '2', title: 'Changement Pneu', description: 'Remplacement de votre pneu usagé.', price: 15, duration_min: 15, image: 'pneu.jpg' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    fetch.mockImplementation((url) => {
      const urlStr = url.toString()
      if (urlStr === '/api/admin/services') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServices)
        })
      }
      if (urlStr.includes('/api/admin/services/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
  })

  it('affiche le titre et charge les forfaits initiaux', async () => {
    render(<AdminServicesPage />)
    
    expect(screen.getByText('Gestion des Forfaits')).toBeInTheDocument()
    
    // Attend le chargement
    expect(await screen.findByText('Révision Urbaine')).toBeInTheDocument()
    expect(screen.getByText('Changement Pneu')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument() // Prix
    expect(screen.getByText('60 minutes')).toBeInTheDocument() // Durée
  })

  it('filtre les forfaits lors de la recherche', async () => {
    render(<AdminServicesPage />)
    
    await screen.findByText('Révision Urbaine')
    
    const searchInput = screen.getByPlaceholderText('Rechercher un forfait...')
    fireEvent.change(searchInput, { target: { value: 'Pneu' } })
    
    // "Révision Urbaine" devrait disparaître tandis que "Changement Pneu" reste
    expect(screen.queryByText('Révision Urbaine')).not.toBeInTheDocument()
    expect(screen.getByText('Changement Pneu')).toBeInTheDocument()
  })

  it('ouvre la modale de suppression et appelle l\'API DELETE', async () => {
    render(<AdminServicesPage />)
    
    await screen.findByText('Révision Urbaine')
    
    // Trouver la card spécifique
    const card = screen.getByText('Révision Urbaine').closest('.bg-card')
    
    // Avec le mock Dropdown, le bouton "Supprimer" est déjà dans le DOM (in-line)
    const deleteOption = within(card).getByText('Supprimer')
    fireEvent.click(deleteOption)
    
    // Vérifier la modale
    expect(screen.getByText('Supprimer ce forfait ?')).toBeInTheDocument()
    
    // Confirmer (le bouton confirm a le texte exact "Oui, supprimer")
    const confirmBtn = screen.getByRole('button', { name: /Oui, supprimer/i })
    fireEvent.click(confirmBtn)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/services/1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  it('affiche un message si aucun forfait n\'est trouvé', async () => {
    render(<AdminServicesPage />)
    
    await screen.findByText('Révision Urbaine')
    
    const searchInput = screen.getByPlaceholderText('Rechercher un forfait...')
    fireEvent.change(searchInput, { target: { value: 'Inexistant' } })
    
    expect(screen.getByText('Aucun forfait trouvé.')).toBeInTheDocument()
  })
})
