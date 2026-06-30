import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toast } from 'sonner'
import { showToast } from '@/lib/notifications'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
  },
}))

describe('showToast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls toast.success with the correct message', () => {
    showToast.success('Success!')
    expect(toast.success).toHaveBeenCalledWith('Success!')
  })

  it('calls toast.error with a default message if none is provided', () => {
    showToast.error()
    expect(toast.error).toHaveBeenCalledWith('Une erreur est survenue')
  })

  it('calls specialized user.created notification', () => {
    showToast.user.created()
    expect(toast.success).toHaveBeenCalledWith('Utilisateur créé avec succès')
  })

  it('calls specialized product.updated notification', () => {
    showToast.product.updated()
    expect(toast.success).toHaveBeenCalledWith('Produit mis à jour')
  })

  it('handles logical conditions like user.blocked', () => {
    showToast.user.blocked(true)
    expect(toast.success).toHaveBeenCalledWith('Utilisateur bloqué')
    
    showToast.user.blocked(false)
    expect(toast.success).toHaveBeenCalledWith('Utilisateur débloqué')
  })
})
