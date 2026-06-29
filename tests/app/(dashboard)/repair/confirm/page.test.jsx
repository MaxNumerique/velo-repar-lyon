import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RepairConfirmPage from '@/app/(dashboard)/repair/confirm/page'
import { useRouter } from 'next/navigation'
import { showToast } from '@/lib/notifications'

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/lib/notifications', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock global fetch
global.fetch = vi.fn()

describe('RepairConfirmPage', () => {
    const mockRouter = {
        push: vi.fn(),
    }

    const mockData = {
        address: '123 Lyon',
        bikeType: 'VTT',
        bikeModel: 'X',
        servicePackageId: 'pkg',
        scheduledAt: new Date().toISOString(),
        firstName: 'Alice',
        lastName: 'Client',
        phone: '06',
        email: 'alice@test.com'
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useRouter).mockReturnValue(mockRouter)
        
        // Mock localStorage
        const store = {}
        vi.stubGlobal('localStorage', {
            getItem: vi.fn(key => store[key] || null),
            setItem: vi.fn((key, value) => { store[key] = value }),
            removeItem: vi.fn(key => { delete store[key] })
        })
    })

    it('affiche une erreur si aucune donnée n\'est trouvée dans localStorage', async () => {
        render(<RepairConfirmPage />)
        
        await waitFor(() => {
            expect(screen.getByText('Aucune donnée de demande trouvée.')).toBeInTheDocument()
        })
    })

    it('soumet les données et affiche un succès', async () => {
        localStorage.setItem('velo_repair_request', JSON.stringify(mockData))
        
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'new-req-id' })
        })

        render(<RepairConfirmPage />)

        expect(screen.getByText('Finalisation...')).toBeInTheDocument()

        await waitFor(() => {
            expect(screen.getByText(/C'est validé/i)).toBeInTheDocument()
        })

        expect(fetch).toHaveBeenCalledWith(
            '/api/repair-request',
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"address":"123 Lyon"')
            })
        )
        
        expect(localStorage.removeItem).toHaveBeenCalledWith('velo_repair_request')
        expect(showToast.success).toHaveBeenCalled()
    })

    it('gère les erreurs de soumission API', async () => {
        localStorage.setItem('velo_repair_request', JSON.stringify(mockData))
        
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Serveur en panne' })
        })

        render(<RepairConfirmPage />)

        await waitFor(() => {
            expect(screen.getByText('Serveur en panne')).toBeInTheDocument()
        })
        
        expect(showToast.error).toHaveBeenCalledWith('Échec de la soumission')
    })

    it('évite la double soumission (React Strict Mode)', async () => {
        localStorage.setItem('velo_repair_request', JSON.stringify(mockData))
        
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ id: 'id' })
        })

        render(<RepairConfirmPage />)
        
        await waitFor(() => {
            expect(screen.getByText(/C'est validé/i)).toBeInTheDocument()
        })

        // On vérifie que fetch n'a été appelé qu'une seule fois malgré le double montage en dev
        expect(fetch).toHaveBeenCalledTimes(1)
    })
})
