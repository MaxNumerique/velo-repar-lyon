import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUser } from '@clerk/nextjs'
import TechnicianMapPage from '../page'
import { geocodeAddress } from '@/lib/google-maps'

// Mock maplibre-gl
const mockMap = {
  addControl: vi.fn(),
  on: vi.fn(), // Don't fire by default
  remove: vi.fn(),
  setStyle: vi.fn(),
  flyTo: vi.fn(),
  fitBounds: vi.fn(),
}

vi.mock('maplibre-gl', () => {
    return {
        default: {
            Map: vi.fn().mockImplementation(function() { return mockMap }),
            NavigationControl: vi.fn(),
            Marker: vi.fn().mockImplementation(function() {
                return {
                    setLngLat: vi.fn().mockReturnThis(),
                    addTo: vi.fn().mockReturnThis(),
                    remove: vi.fn(),
                }
            }),
            LngLatBounds: vi.fn().mockImplementation(function() {
                return {
                    extend: vi.fn().mockReturnThis(),
                }
            }),
        }
    }
})

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
}))

// Mock Next.js navigation
const mockRouter = {
  push: vi.fn(),
}
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// Mock Google Maps
vi.mock('@/lib/google-maps', () => ({
  geocodeAddress: vi.fn(),
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

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn().mockImplementation((success) => 
    success({ coords: { latitude: 45.7640, longitude: 4.8357 } })
  ),
}
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true,
  writable: true
})

// Mock environment variables
process.env.NEXT_PUBLIC_MAPTILER_KEY = 'test-key'

// Mock DeleteConfirmationModal to simplify tests
vi.mock('@/components/shared/DeleteConfirmationModal', () => ({
    DeleteConfirmationModal: ({ open, onConfirm, onOpenChange }) => open ? (
        <div data-testid="delete-modal">
            <button onClick={onConfirm}>CONFIRMER</button>
            <button onClick={() => onOpenChange(false)}>RETOUR</button>
        </div>
    ) : null
}))

describe('TechnicianMapPage', () => {
    const mockAppointments = [
        {
          id: 'appt1',
          clientFirstName: 'Jean',
          clientLastName: 'Dupont',
          address: '123 Rue de la Paix, Lyon',
          lat: 45.75,
          lng: 4.85,
          bikeDetails: { brand: 'VanMoof', model: 'S3' },
          scheduledAt: new Date().toISOString(),
          status: 'SCHEDULED'
        },
        {
          id: 'appt2',
          clientFirstName: 'Alice',
          clientLastName: 'Martin',
          address: '10 Place Bellecour, Lyon',
          lat: 45.76,
          lng: 4.83,
          bikeDetails: { brand: 'Cowboy', model: '4' },
          scheduledAt: new Date(Date.now() + 3600000).toISOString(),
          status: 'EN_ROUTE'
        }
    ]

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useUser).mockReturnValue({
            isLoaded: true,
            user: { id: 'user1', publicMetadata: { role: 'TECHNICIAN' } }
        })
        fetch.mockResolvedValue({
            ok: true,
            json: async () => mockAppointments
        })
        geocodeAddress.mockResolvedValue({ lat: 45.76, lng: 4.83 })
    })

    it('affiche l\'état de chargement initial', () => {
        render(<TechnicianMapPage />)
        expect(screen.getByText(/Initialisation de la carte/i)).toBeInTheDocument()
    })

    it('charge les interventions et les affiche sur la carte', async () => {
        mockMap.on.mockImplementation((event, cb) => {
            if (event === 'load') cb()
        })
        render(<TechnicianMapPage />)
        
        await waitFor(() => {
            expect(screen.queryByText(/Initialisation de la carte/i)).not.toBeInTheDocument()
        }, { timeout: 3000 })

        expect(screen.getByText('Ma Tournée')).toBeInTheDocument()
        expect(screen.getByText('2 interventions')).toBeInTheDocument()
    })

    it('géocode les adresses manquantes de coordonnées', async () => {
        const apptsWithMissingCoords = [
            {
                ...mockAppointments[0],
                lat: null,
                lng: null
            }
        ]
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => apptsWithMissingCoords
        })

        render(<TechnicianMapPage />)
        
        await waitFor(() => {
            expect(geocodeAddress).toHaveBeenCalledWith(apptsWithMissingCoords[0].address)
        })
    })

    it('permet de sélectionner une intervention via la liste rapide', async () => {
        mockMap.on.mockImplementation((event, cb) => {
            if (event === 'load') cb()
        })
        render(<TechnicianMapPage />)
        
        const tourButtons = await screen.findAllByRole('button', { name: /#\d/ })
        fireEvent.click(tourButtons[0])

        expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
        expect(screen.getByText('PROGRAMMÉ')).toBeInTheDocument()
    })

    it('gère le passage au statut "EN_ROUTE"', async () => {
        mockMap.on.mockImplementation((event, cb) => {
            if (event === 'load') cb()
        })
        render(<TechnicianMapPage />)
        
        const tourButtons = await screen.findAllByRole('button', { name: /#\d/ })
        fireEvent.click(tourButtons[0])

        const departBtn = await screen.findByText(/Partir en intervention/i)
        fireEvent.click(departBtn)

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('appt1'),
                expect.objectContaining({
                    method: 'PATCH',
                    body: expect.stringContaining('"status":"EN_ROUTE"')
                })
            )
        })
    })

    it('gère le passage au statut "COMPLETED" et retire l\'intervention de la liste', async () => {
        mockMap.on.mockImplementation((event, cb) => {
            if (event === 'load') cb()
        })
        // Appt already ON_SITE
        const onSiteAppt = {
            ...mockAppointments[0],
            status: 'ON_SITE'
        }
        fetch.mockResolvedValue({
            ok: true,
            json: async () => [onSiteAppt]
        })

        render(<TechnicianMapPage />)
        
        const tourButtons = await screen.findAllByRole('button', { name: /#\d/ })
        fireEvent.click(tourButtons[0])

        const finishBtn = await screen.findByText(/Terminer l'intervention/i)
        fireEvent.click(finishBtn)

        await waitFor(() => {
            // Optimistic update or refetch should remove it
            expect(screen.queryByText('Jean Dupont')).not.toBeInTheDocument()
        })
    })

    it('permet d\'annuler une intervention via la modale', async () => {
        mockMap.on.mockImplementation((event, cb) => {
            if (event === 'load') cb()
        })
        render(<TechnicianMapPage />)
        
        const tourButtons = await screen.findAllByRole('button', { name: /#\d/ })
        fireEvent.click(tourButtons[0])

        const cancelBtn = await screen.findByText(/Annuler l'intervention/i)
        fireEvent.click(cancelBtn)

        const modal = screen.getByTestId('delete-modal')
        const confirmBtn = within(modal).getByText('CONFIRMER')
        fireEvent.click(confirmBtn)

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('appt1'),
                expect.objectContaining({
                    method: 'PATCH',
                    body: expect.stringContaining('"status":"CANCELLED"')
                })
            )
        })
    })

    it('change le style de la carte', async () => {
        mockMap.on.mockImplementation((event, cb) => {
            if (event === 'load') cb()
        })
        render(<TechnicianMapPage />)
        
        const satBtn = await screen.findByText('SAT')
        fireEvent.click(satBtn)

        expect(mockMap.setStyle).toHaveBeenCalledWith(expect.stringContaining('hybrid'))
        
        const planBtn = await screen.findByText('PLAN')
        fireEvent.click(planBtn)
        expect(mockMap.setStyle).toHaveBeenCalledWith(expect.stringContaining('streets-v2'))
    })
})
