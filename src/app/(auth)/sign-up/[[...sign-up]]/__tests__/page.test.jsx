import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SignUpPage from '../page'

// Mock Clerk SignUp component
vi.mock('@clerk/nextjs', () => ({
  SignUp: vi.fn(({ appearance, forceRedirectUrl, signInForceRedirectUrl }) => (
    <div data-testid="clerk-signup">
      SignUp Component
      <span data-testid="force-redirect">{forceRedirectUrl}</span>
    </div>
  ))
}))

// Mock next/navigation useSearchParams
const mockGet = vi.fn()
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet
  })
}))

describe('SignUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders SignUp component with default redirect URL /interventions', () => {
    mockGet.mockReturnValue(null) // No redirect_url in param
    
    render(<SignUpPage />)
    
    expect(screen.getByTestId('clerk-signup')).toBeInTheDocument()
    expect(screen.getByTestId('force-redirect')).toHaveTextContent('/interventions')
  })

  it('renders SignUp component with custom redirect URL from searchParams', () => {
    mockGet.mockReturnValue('/onboarding')
    
    render(<SignUpPage />)
    
    expect(screen.getByTestId('force-redirect')).toHaveTextContent('/onboarding')
  })
})
