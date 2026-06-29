import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SignInPage from '@/app/(auth)/sign-in/[[...sign-in]]/page'

// Mock Clerk SignIn component
vi.mock('@clerk/nextjs', () => ({
  SignIn: vi.fn(({ appearance, forceRedirectUrl, signUpForceRedirectUrl }) => (
    <div data-testid="clerk-signin">
      SignIn Component
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

describe('SignInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders SignIn component with default redirect URL /interventions', () => {
    mockGet.mockReturnValue(null)
    
    render(<SignInPage />)
    
    expect(screen.getByTestId('clerk-signin')).toBeInTheDocument()
    expect(screen.getByTestId('force-redirect')).toHaveTextContent('/interventions')
  })

  it('renders SignIn component with custom redirect URL from searchParams', () => {
    mockGet.mockReturnValue('/profile')
    
    render(<SignInPage />)
    
    expect(screen.getByTestId('force-redirect')).toHaveTextContent('/profile')
  })
})
