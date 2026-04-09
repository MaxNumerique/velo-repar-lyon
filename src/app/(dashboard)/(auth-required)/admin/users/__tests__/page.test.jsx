import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AdminUsersPage from '../page'

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Users: () => <div data-testid="icon-users" />,
  Search: () => <div data-testid="icon-search" />,
  Filter: () => <div data-testid="icon-filter" />,
  MoreVertical: () => <div data-testid="icon-more" />,
  ShieldAlert: () => <div data-testid="icon-shield-alert" />,
  ShieldCheck: () => <div data-testid="icon-shield-check" />,
  Trash2: () => <div data-testid="icon-trash" />,
  UserPlus: () => <div data-testid="icon-user-plus" />,
  Mail: () => <div data-testid="icon-mail" />,
  Phone: () => <div data-testid="icon-phone" />,
  Loader2: () => <div data-testid="icon-loader" />,
  Edit2: () => <div data-testid="icon-edit" />,
  AlertTriangle: () => <div data-testid="icon-alert" />,
  Shield: () => <div data-testid="icon-shield" />,
  Wrench: () => <div data-testid="icon-wrench" />,
  User: () => <div data-testid="icon-user" />,
}))

// Mock showToast
vi.mock('@/lib/notifications', () => ({
  showToast: {
    user: {
      blocked: vi.fn(),
      deleted: vi.fn(),
      created: vi.fn(),
      updated: vi.fn(),
      error: vi.fn(),
    }
  }
}))

// Mock Dialog components to render content and be findable by testid
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <div>{children}</div>,
  DialogFooter: ({ children }) => <div>{children}</div>,
  DialogDescription: ({ children }) => <div>{children}</div>,
}))

// Mock DropdownMenu to render children directly for easier testing
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

// Mock Select to use a normal select for ease of testing
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }) => (
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)} 
      data-testid="select-mock"
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }) => <>{children}</>,
  SelectValue: ({ placeholder }) => <option disabled value="">{placeholder}</option>,
  SelectContent: ({ children }) => <>{children}</>,
  SelectItem: ({ children, value }) => <option value={value}>{children}</option>,
}))

// Mock global fetch
global.fetch = vi.fn()

// Mock scrollIntoView which is not implemented in JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Set timeout for this test file
vi.setConfig({ testTimeout: 15000 })

describe('AdminUsersPage', () => {
  const mockUsers = [
    { 
      id: 'u1', 
      firstName: 'Jean', 
      lastName: 'Dupont', 
      email: 'jean@exemple.com', 
      role: 'CLIENT', 
      isBlocked: false, 
      createdAt: new Date().toISOString() 
    },
    { 
      id: 'u2', 
      firstName: 'Marc', 
      lastName: 'Tech', 
      email: 'marc@tech.com', 
      role: 'TECHNICIAN', 
      isBlocked: false, 
      createdAt: new Date().toISOString() 
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    
    fetch.mockImplementation((url) => {
      const urlStr = url.toString()
      const json = () => Promise.resolve(urlStr.includes('?') ? [...mockUsers] : { success: true })
      return Promise.resolve({
        ok: true,
        json
      })
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Helper to advance time and flush microtasks
  const waitDebounce = async (ms = 300) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })
    // Flush microtasks
    await Promise.resolve()
  }

  it('affiche le titre et charge les utilisateurs', async () => {
    render(<AdminUsersPage />)
    
    await waitDebounce(300)
    
    expect(screen.getByText('Gestion des Utilisateurs')).toBeInTheDocument()
    
    await waitFor(() => {
        expect(screen.queryByText('Chargement...')).not.toBeInTheDocument()
    }, { timeout: 2000 })

    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
  })

  it('filtre par rôle via les boutons de filtre', async () => {
    render(<AdminUsersPage />)
    await waitDebounce(300)
    
    const techFilterBtn = screen.getByText('Techniciens')
    fireEvent.click(techFilterBtn)
    
    await waitDebounce(300)
    
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('role=TECHNICIAN'))
  })

  it('recherche un utilisateur avec debounce', async () => {
    render(<AdminUsersPage />)
    await waitDebounce(300)
    
    const searchInput = screen.getByPlaceholderText(/Rechercher par nom/i)
    fireEvent.change(searchInput, { target: { value: 'Jean' } })
    
    await vi.advanceTimersByTimeAsync(100)
    const searchCalls = fetch.mock.calls.filter(c => c[0].includes('search=Jean'))
    expect(searchCalls.length).toBe(0)
    
    await waitDebounce(200)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('search=Jean'))
  })

  it('ouvre la modale de création et soumet le formulaire', async () => {
    render(<AdminUsersPage />)
    await waitDebounce(300)
    
    const createBtn = screen.getByText('Nouvel Utilisateur')
    fireEvent.click(createBtn)
    
    const dialog = screen.getByTestId('dialog')
    
    fireEvent.change(within(dialog).getByLabelText('Prénom'), { target: { value: 'Alice' } })
    fireEvent.change(within(dialog).getByLabelText('Nom'), { target: { value: 'Client' } })
    fireEvent.change(within(dialog).getByLabelText('Email'), { target: { value: 'alice@test.com' } })
    fireEvent.change(within(dialog).getByLabelText(/Mot de passe provisoire/i), { target: { value: 'password123' } })
    
    const submitBtn = within(dialog).getByText("Créer l'utilisateur")
    fireEvent.click(submitBtn)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"email":"alice@test.com"')
        })
      )
    }, { timeout: 4000 })
  })

  it('ouvre la modale d\'édition et modifie un utilisateur', async () => {
    render(<AdminUsersPage />)
    await waitDebounce(300)
    
    const editBtns = await screen.findAllByTitle('Modifier')
    fireEvent.click(editBtns[0])
    
    const dialog = screen.getByTestId('dialog')
    const firstNameInput = within(dialog).getByLabelText('Prénom')
    fireEvent.change(firstNameInput, { target: { value: 'Jeannot' } })
    
    const saveBtn = within(dialog).getByText('Enregistrer')
    fireEvent.click(saveBtn)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/u1'),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"firstName":"Jeannot"')
        })
      )
    }, { timeout: 4000 })
  })

  it('peut bloquer/débloquer un utilisateur via UserCard', async () => {
    render(<AdminUsersPage />)
    await waitDebounce(300)
    
    const userCard = await waitFor(() => {
        const card = screen.getByText('Jean Dupont').closest('.group')
        if (!card) throw new Error('Card not found')
        return card
    })

    const moreBtn = within(userCard).getByTitle("Plus d'actions")
    fireEvent.click(moreBtn)
    
    const blockBtn = within(userCard).getByText(/Bloquer l'accès/i)
    fireEvent.click(blockBtn)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/u1'),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"isBlocked":true')
        })
      )
    }, { timeout: 4000 })
  })

  it('peut supprimer un utilisateur après confirmation', async () => {
    render(<AdminUsersPage />)
    await waitDebounce(300)
    
    const userCard = await waitFor(() => {
        const card = screen.getByText('Jean Dupont').closest('.group')
        if (!card) throw new Error('Card not found')
        return card
    })

    const moreBtn = within(userCard).getByTitle("Plus d'actions")
    fireEvent.click(moreBtn)
    
    const deleteBtn = within(userCard).getByText(/Supprimer définitivement/i)
    fireEvent.click(deleteBtn)
    
    const dialog = screen.getByTestId('dialog')
    const confirmBtn = within(dialog).getByText('Oui, supprimer')
    fireEvent.click(confirmBtn)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/u1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    }, { timeout: 4000 })
  })
})
