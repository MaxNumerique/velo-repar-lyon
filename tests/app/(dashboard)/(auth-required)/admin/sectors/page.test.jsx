import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SectorsPage from '@/app/(dashboard)/(auth-required)/admin/sectors/page'

vi.mock('maplibre-gl', () => {
  class MockMap {
    constructor() {
      this.addControl = vi.fn();
      this.on = vi.fn((event, callback) => {
        if (event === 'load') callback();
      });
      this.remove = vi.fn();
      this.addSource = vi.fn();
      this.addLayer = vi.fn();
      this.flyTo = vi.fn();
      this.setStyle = vi.fn();
    }
  }
  return {
    default: {
      Map: MockMap,
      NavigationControl: vi.fn(),
    }
  };
});

vi.mock('@mapbox/mapbox-gl-draw', () => {
  class MockDraw {
    constructor() {
      this.onAdd = vi.fn();
      this.onRemove = vi.fn();
      this.add = vi.fn();
      this.get = vi.fn((id) => ({
        id,
        type: 'Feature',
        field: 'foo',
        geometry: { type: 'Polygon', coordinates: [] },
        properties: { user_color: '#ff0000' }
      }));
      this.getAll = vi.fn(() => ({ features: [] }));
      this.delete = vi.fn();
      this.setFeatureProperty = vi.fn();
      this.changeMode = vi.fn();
      this.setFeatureProperty = vi.fn();
    }
  }
  MockDraw.lib = {
    theme: []
  };
  return {
    default: MockDraw
  };
});

global.fetch = vi.fn()

describe('SectorsPage', () => {
  const mockTechs = [{ id: 't1', firstName: 'Jean', lastName: 'Tech', role: 'TECHNICIAN' }]
  const mockSectorsData = [
    { id: 's1', name: 'Lyon Centre', color: '#ff0000', technicians: [{ id: 't1' }], boundary: { type: 'Polygon', coordinates: [] } }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    fetch.mockImplementation((url, options) => {
        const urlStr = url.toString();
        if (urlStr.includes('/api/admin/users')) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTechs) })
        }
        if (urlStr.includes('/api/admin/sectors')) {
            const method = options?.method?.toUpperCase() || 'GET';
            if (method === 'GET') {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSectorsData) })
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
  })

  it('affiche le titre et charge les données initiales', async () => {
    render(<SectorsPage />)
    
    expect(screen.getByText("Secteurs d'intervention")).toBeInTheDocument()

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/users?role=TECHNICIAN'), expect.any(Object))
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/sectors'), expect.any(Object))
    })

    expect(await screen.findByText('Lyon Centre')).toBeInTheDocument()
  })

  it('permet de sélectionner un secteur et d\'afficher ses détails', async () => {
    render(<SectorsPage />)
    
    const sectorBtn = await screen.findByText('Lyon Centre')
    expect(sectorBtn).toBeInTheDocument()
    
    fireEvent.click(sectorBtn)

    await screen.findByText(/Édition/i)
    
    const nameInput = await screen.findByLabelText(/Nom du secteur/i)
    expect(nameInput.value).toBe('Lyon Centre')
  })

  it('appelle l\'API de sauvegarde lors du clic sur Sauver', async () => {
    render(<SectorsPage />)
    
    const sectorBtn = await screen.findByText('Lyon Centre')
    fireEvent.click(sectorBtn)

    const saveBtn = await screen.findByText('Sauver')
    fireEvent.click(saveBtn)

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
            '/api/admin/sectors',
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"name":"Lyon Centre"')
            })
        )
    })
  })

  it('ouvre la modale de suppression et appelle l\'API DELETE', async () => {
    render(<SectorsPage />)
    
    const sectorBtn = await screen.findByText('Lyon Centre')
    fireEvent.click(sectorBtn)

    const deleteBtn = await screen.findByTitle('Supprimer')
    fireEvent.click(deleteBtn)

    expect(await screen.findByText('Supprimer ce secteur ?')).toBeInTheDocument()

    const confirmBtn = screen.getByText('Oui, supprimer')
    fireEvent.click(confirmBtn)

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/sectors?id=s1'),
            expect.objectContaining({ method: 'DELETE' })
        )
    })
  })
})
