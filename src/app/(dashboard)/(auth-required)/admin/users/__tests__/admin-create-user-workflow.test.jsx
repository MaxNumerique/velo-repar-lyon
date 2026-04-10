import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AdminUsersPage from '../page'

// Mock icons
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
  ChevronLeft: () => <div data-testid="icon-chevron-left" />,
  ChevronRight: () => <div data-testid="icon-chevron-right" />,
}))

// Mock notifications
vi.mock('@/lib/notifications', () => ({
  showToast: {
    user: {
      created: vi.fn(),
      error: vi.fn(),
    }
  }
}))

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <div>{children}</div>,
  DialogFooter: ({ children }) => <div>{children}</div>,
  DialogDescription: ({ children }) => <div>{children}</div>,
}))

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

// Mock fetch
global.fetch = vi.fn()

// Mock browser APIs
window.HTMLElement.prototype.scrollIntoView = vi.fn()

describe('Workflow Integration: Admin Create User', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    
    // Default fetch behavior: return empty list on load
    fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const waitDebounce = async (ms = 300) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })
    await Promise.resolve()
  }

  it('permits an admin to create a new technician through the UI', async () => {
    render(<AdminUsersPage />)
    await waitDebounce(300)

    // 1. Open Modal
    const createBtn = screen.getByText('Nouvel Utilisateur')
    fireEvent.click(createBtn)
    
    const dialog = screen.getByTestId('dialog')
    expect(dialog).toBeInTheDocument()

    // 2. Fill Form
    fireEvent.change(within(dialog).getByLabelText('Prénom'), { target: { value: 'Bob' } })
    fireEvent.change(within(dialog).getByLabelText('Nom'), { target: { value: 'Technicien' } })
    fireEvent.change(within(dialog).getByLabelText('Email'), { target: { value: 'bob@velo.com' } })
    fireEvent.change(within(dialog).getByLabelText(/Mot de passe provisoire/i), { target: { value: 'securePass123' } })
    
    // Select Role: TECHNICIAN (mocked select)
    const roleSelect = within(dialog).getByTestId('select-mock')
    fireEvent.change(roleSelect, { target: { value: 'TECHNICIAN' } })

    // 3. Submit
    const submitBtn = within(dialog).getByText("Créer l'utilisateur")
    fireEvent.click(submitBtn)

    // 4. Verification
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            firstName: 'Bob',
            lastName: 'Technicien',
            email: 'bob@velo.com',
            role: 'TECHNICIAN',
            password: 'securePass123'
          })
        })
      )
    })
  })
})
