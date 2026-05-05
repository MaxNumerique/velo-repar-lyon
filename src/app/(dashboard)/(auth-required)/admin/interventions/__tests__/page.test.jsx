import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUser } from '@clerk/nextjs'
import AdminInterventionsPage from '../page'

// Mocks
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
}))

// Mock UI components
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }) => (
    <div data-testid="select-mock" onClick={(e) => {
      if (e.target.dataset.value) onValueChange(e.target.dataset.value)
    }}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }) => <button>{children}</button>,
  SelectValue: ({ placeholder }) => <span>{placeholder}</span>,
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectItem: ({ children, value }) => <button data-value={value}>{children}</button>,
}))

vi.mock('@/components/admin/AdminHeader', () => ({
  AdminHeader: ({ title }) => <div data-testid="admin-header">{title}</div>
}))

vi.mock('@/components/dashboard/InterventionDetails', () => ({
  InterventionDetails: () => <div data-testid="intervention-details" />
}))

// Mock InterventionCard to simplify tests and avoid sub-component issues
vi.mock('@/components/shared/InterventionCard', () => ({
    InterventionCard: ({ intervention, onDelete, onStatusUpdate }) => (
      <div data-testid="intervention-card">
        <span>{intervention.clientFirstName} {intervention.clientLastName}</span>
        <button onClick={() => onStatusUpdate(intervention.id, 'EN_ROUTE')}>En route</button>
        <button onClick={() => onDelete(intervention.id)}>Supprimer</button>
      </div>
    )
}))

// Mock global fetch
global.fetch = vi.fn()

// Mock scrollIntoView which is not implemented in JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn()

describe('AdminInterventionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useUser).mockReturnValue({
        isLoaded: true,
        user: { publicMetadata: { role: 'ADMIN' } }
    })
    // Default fetch mock to return array
    fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    })
  })

  const mockInterventions = [
    {
      id: '1',
      address: '123 Rue de la Paix',
      clientFirstName: 'Admin',
      clientLastName: 'Test',
      createdAt: new Date().toISOString(),
      servicePackage: { title: 'Premium', price: 100 },
      appointment: { status: 'SCHEDULED', scheduledAt: new Date().toISOString() }
    }
  ]

  it('affiche l\'état de chargement initial puis les interventions', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockInterventions
    })

    render(<AdminInterventionsPage />)
    
    expect(screen.getByText('Chargement...')).toBeInTheDocument()

    await waitFor(() => {
        expect(screen.getByText('Admin Test')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('recherche avec filtre les résultats', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockInterventions
    })

    render(<AdminInterventionsPage />)
    
    const searchInput = screen.getByPlaceholderText(/Rechercher/i)
    fireEvent.change(searchInput, { target: { value: 'Admin' } })

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('search=Admin'))
    }, { timeout: 2000 })
  })

  it('appelle l\'API DELETE lors de la suppression', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockInterventions
    })
    
    render(<AdminInterventionsPage />)

    const deleteBtn = await screen.findByText('Supprimer')
    fireEvent.click(deleteBtn)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/interventions/1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    }, { timeout: 2000 })
  })

  it('change d\'onglet et filtre les interventions localement', async () => {
    const todayInterventions = [
        { 
            id: 'today', 
            clientFirstName: 'Today', 
            clientLastName: 'User',
            appointment: { status: 'SCHEDULED', scheduledAt: new Date().toISOString() } 
        },
        { 
            id: 'tomorrow', 
            clientFirstName: 'Tomorrow', 
            clientLastName: 'User',
            appointment: { status: 'SCHEDULED', scheduledAt: new Date(Date.now() + 86400000).toISOString() } 
        }
    ]

    fetch.mockResolvedValue({
      ok: true,
      json: async () => todayInterventions
    })

    render(<AdminInterventionsPage />)
    
    // Check title (simplified)
    expect(screen.getByText('Interventions')).toBeInTheDocument()

    await waitFor(() => {
        expect(screen.getByText('Today User')).toBeInTheDocument()
    }, { timeout: 2000 })

    // With the mock, the trigger and items are all in the DOM
    // We can just find the item and click it
    const upcomingOption = screen.getAllByText('À venir')[0]
    fireEvent.click(upcomingOption)

    await waitFor(() => {
        expect(screen.getByText('Tomorrow User')).toBeInTheDocument()
        expect(screen.queryByText('Today User')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })
})
