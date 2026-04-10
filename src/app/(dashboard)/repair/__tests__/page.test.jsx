import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RepairPage from '../page'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
}))

// Mock Sub-components to avoid deep dependencies
vi.mock('@/components/repair/RepairStepper', () => ({
  RepairStepper: ({ currentStep }) => <div data-testid="stepper">Step: {currentStep}</div>
}))
vi.mock('@/components/repair/StepBikeType', () => ({
  StepBikeType: ({ updateData }) => (
    <div data-testid="step-1">
      <button onClick={() => updateData({ bikeType: 'VTT', bikeModel: 'Trek X' })}>Select Bike</button>
    </div>
  )
}))
vi.mock('@/components/repair/StepServices', () => ({
  StepServices: ({ updateData }) => (
    <div data-testid="step-2">
      <button onClick={() => updateData({ servicePackageId: 'pkg-1' })}>Select Service</button>
    </div>
  )
}))
vi.mock('@/components/repair/StepUserInfo', () => ({
  StepUserInfo: ({ data, updateData }) => (
    <div data-testid="step-3">
        <span>{data.firstName}</span>
      <button onClick={() => updateData({ firstName: 'Alice', lastName: 'Client', phone: '0600000000', address: '123 Lyon' })}>Fill Info</button>
    </div>
  )
}))
vi.mock('@/components/repair/StepScheduling', () => ({
  default: ({ onUpdate }) => (
    <div data-testid="step-4">
      <button onClick={() => onUpdate({ scheduledAt: new Date().toISOString() })}>Schedule</button>
    </div>
  )
}))
vi.mock('@/components/repair/StepValidation', () => ({
  StepValidation: () => <div data-testid="step-5">Validation</div>
}))
vi.mock('@/components/repair/RepairSummarySide', () => ({
  RepairSummarySide: () => <div data-testid="summary-side" />
}))

// Mock window.scrollTo
window.scrollTo = vi.fn()

describe('RepairPage', () => {
    const mockRouter = {
        push: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useRouter).mockReturnValue(mockRouter)
        vi.mocked(useUser).mockReturnValue({ isLoaded: true, user: null })
        
        // Mock localStorage
        const store = {}
        vi.stubGlobal('localStorage', {
            getItem: vi.fn(key => store[key] || null),
            setItem: vi.fn((key, value) => { store[key] = value }),
            removeItem: vi.fn(key => { delete store[key] })
        })

        // Mock fetch
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({})
        })
    })

    it('affiche le stepper et le contenu de l\'étape 1 par défaut', () => {
        render(<RepairPage />)
        expect(screen.getByTestId('stepper')).toHaveTextContent('Step: 1')
        expect(screen.getByTestId('step-1')).toBeInTheDocument()
    })

    it('charge les données depuis localStorage si présentes', () => {
        localStorage.setItem('velo_repair_request', JSON.stringify({ bikeType: 'VTT', bikeModel: 'Trek X' }))
        render(<RepairPage />)
        expect(screen.getByTestId('step-1')).toBeInTheDocument()
    })

    it('navigue vers l\'étape 2 après sélection d\'un vélo', async () => {
        render(<RepairPage />)
        
        const selectBtn = screen.getByText('Select Bike')
        fireEvent.click(selectBtn)

        const nextBtn = screen.getByRole('button', { name: /continuer/i })
        expect(nextBtn).not.toBeDisabled()
        fireEvent.click(nextBtn)

        await waitFor(() => {
            expect(screen.getByTestId('stepper')).toHaveTextContent('Step: 2')
        })
    })

    it('désactive le bouton Continuer si l\'étape n\'est pas valide', () => {
        render(<RepairPage />)
        const nextBtn = screen.getByRole('button', { name: /continuer/i })
        expect(nextBtn).toBeDisabled()
    })

    it('pré-remplit les données utilisateur quand connecté', async () => {
        vi.mocked(useUser).mockReturnValue({ 
            isLoaded: true, 
            user: { 
                firstName: 'Jean', 
                lastName: 'Durand', 
                primaryEmailAddress: { emailAddress: 'jean@test.com' } 
            } 
        })

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ 
                firstName: 'Jean', 
                lastName: 'Durand', 
                email: 'jean@test.com',
                phone: '0612345678',
                address: '10 Rue de la République'
            })
        })

        render(<RepairPage />)

        // On va à l'étape 3
        fireEvent.click(screen.getByText('Select Bike'))
        fireEvent.click(screen.getByRole('button', { name: /continuer/i }))
        fireEvent.click(screen.getByText('Select Service'))
        fireEvent.click(screen.getByRole('button', { name: /continuer/i }))

        await waitFor(() => {
            expect(screen.getByTestId('step-3')).toHaveTextContent('Jean')
        })
    })

    it('redirige vers /sign-up à la validation finale', async () => {
        // Pré-remplir pour aller vite à l'étape 5
        localStorage.setItem('velo_repair_request', JSON.stringify({ 
            bikeType: 'VTT', bikeModel: 'X', 
            servicePackageId: 'pkg', 
            firstName: 'A', lastName: 'B', phone: '0', address: 'L',
            scheduledAt: new Date().toISOString()
        }))
        
        render(<RepairPage />)
        
        // Aller au bout du stepper
        for(let i=1; i<5; i++) {
            fireEvent.click(screen.getByRole('button', { name: /continuer/i }))
        }

        const validBtn = screen.getByRole('button', { name: /valider ma demande/i })
        fireEvent.click(validBtn)

        expect(mockRouter.push).toHaveBeenCalledWith('/sign-up?redirect_url=/repair/confirm')
    })
})
