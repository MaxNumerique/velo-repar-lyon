import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RepairPage from '@/app/(dashboard)/repair/page'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useRepair } from '@/features/interventions/booking/context/RepairContext'

global.mockUseRepair = useRepair

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
}))

vi.mock('@/features/interventions/booking/components/RepairStepper', () => ({
  RepairStepper: ({ currentStep }) => <div data-testid="stepper">Step: {currentStep}</div>
}))
vi.mock('@/features/interventions/booking/components/StepBikeType', () => ({
  StepBikeType: () => {
    const { updateFormData } = global.mockUseRepair()
    return (
      <div data-testid="step-1">
        <button onClick={() => updateFormData({ bikeType: 'VTT', bikeModel: 'Trek X' })}>Select Bike</button>
      </div>
    )
  }
}))
vi.mock('@/features/interventions/booking/components/StepServices', () => ({
  StepServices: () => {
    const { updateFormData } = global.mockUseRepair()
    return (
      <div data-testid="step-2">
        <button onClick={() => updateFormData({ servicePackageId: 'pkg-1' })}>Select Service</button>
      </div>
    )
  }
}))
vi.mock('@/features/interventions/booking/components/StepUserInfo', () => ({
  StepUserInfo: () => {
    const { formData, updateFormData } = global.mockUseRepair()
    return (
      <div data-testid="step-3">
        <span>{formData.firstName}</span>
        <button onClick={() => updateFormData({ firstName: 'Alice', lastName: 'Client', phone: '0600000000', address: '123 Lyon', isAddressCovered: true })}>Fill Info</button>
      </div>
    )
  }
}))
vi.mock('@/features/interventions/booking/components/StepScheduling', () => ({
  default: () => {
    const { updateFormData } = global.mockUseRepair()
    return (
      <div data-testid="step-4">
        <button onClick={() => updateFormData({ scheduledAt: new Date().toISOString() })}>Schedule</button>
      </div>
    )
  }
}))
vi.mock('@/features/interventions/booking/components/StepValidation', () => ({
  StepValidation: () => <div data-testid="step-5">Validation</div>
}))
vi.mock('@/features/interventions/booking/components/RepairSummarySide', () => ({
  RepairSummarySide: () => <div data-testid="summary-side" />
}))

window.scrollTo = vi.fn()

describe('RepairPage', () => {
    const mockRouter = {
        push: vi.fn(),
    }
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useRouter).mockReturnValue(mockRouter)
        vi.mocked(useUser).mockReturnValue({ isLoaded: true, user: null })
        
        const store = {}
        vi.stubGlobal('localStorage', {
            getItem: vi.fn(key => store[key] || null),
            setItem: vi.fn((key, value) => { store[key] = value }),
            removeItem: vi.fn(key => { delete store[key] })
        })
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
        fireEvent.click(screen.getByText('Select Bike'))
        fireEvent.click(screen.getByRole('button', { name: /continuer/i }))
        fireEvent.click(screen.getByText('Select Service'))
        fireEvent.click(screen.getByRole('button', { name: /continuer/i }))
        await waitFor(() => {
            expect(screen.getByTestId('step-3')).toHaveTextContent('Jean')
        })
    })

    it('redirige vers /sign-up à la validation finale', async () => {
        localStorage.setItem('velo_repair_request', JSON.stringify({ 
            bikeType: 'VTT', bikeModel: 'X', 
            servicePackageId: 'pkg', 
            firstName: 'A', lastName: 'B', phone: '0', address: 'L', isAddressCovered: true,
            scheduledAt: new Date().toISOString()
        }))
        render(<RepairPage />)
        for(let i=1; i<5; i++) {
            fireEvent.click(screen.getByRole('button', { name: /continuer/i }))
        }
        const validBtn = screen.getByRole('button', { name: /valider ma demande/i })
        fireEvent.click(validBtn)
        expect(mockRouter.push).toHaveBeenCalledWith('/sign-up?redirect_url=/interventions')
    })
})
