import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProductsPage from '../page'

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@/components/admin/AdminHeader', () => ({
  AdminHeader: ({ title }) => <div data-testid="admin-header">{title}</div>
}))

// Mock window.confirm
window.confirm = vi.fn()

// Mock global fetch
global.fetch = vi.fn()

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn()

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default fetch mock
    fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    })
  })

  const mockProducts = [
    {
      id: 'p1',
      name: 'Pneu VTT',
      price: 25,
      category: 'Pièces',
      isActive: true,
      description: 'Pneu robuste',
      image: null
    },
    {
      id: 'p2',
      name: 'Pompe',
      price: 15,
      category: 'Accessoires',
      isActive: false,
      description: 'Pompe à pied',
      image: null
    }
  ]

  it('affiche l\'état de chargement puis les produits', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    })

    render(<ProductsPage />)
    
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument()

    await waitFor(() => {
        expect(screen.getByText('Pneu VTT')).toBeInTheDocument()
        expect(screen.getByText('Pompe')).toBeInTheDocument()
    })
  })

  it('affiche un message si aucun produit n\'est trouvé', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    render(<ProductsPage />)
    
    await waitFor(() => {
        expect(screen.getByText('Aucun produit trouvé')).toBeInTheDocument()
    })
  })

  it('filtre par catégorie', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    })

    render(<ProductsPage />)
    
    const categoryBtn = screen.getByRole('button', { name: 'Pièces' })
    fireEvent.click(categoryBtn)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('category=Pi%C3%A8ces'), expect.any(Object))
    })
  })

  it('recherche au clic sur Entrée', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    })

    render(<ProductsPage />)
    
    const searchInput = screen.getByPlaceholderText(/Rechercher/i)
    fireEvent.change(searchInput, { target: { value: 'Pneu' } })
    
    expect(fetch).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('search=Pneu'), expect.any(Object))
    })
  })

  it('supprime un produit après confirmation', async () => {
    window.confirm.mockReturnValue(true)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    })
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    render(<ProductsPage />)
    
    const productCard = await screen.findByText('Pneu VTT')
    const buttons = screen.getAllByRole('button')
    const deleteBtn = buttons.find(btn => btn.className.includes('text-red-500'))
    
    expect(deleteBtn).toBeDefined()
    fireEvent.click(deleteBtn)

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/products/p1'),
          expect.objectContaining({ method: 'DELETE' })
        )
    })
  })
})
