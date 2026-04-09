import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClerkClient } from '@clerk/nextjs/server'
import prisma from '../prisma'

// Use vi.hoisted to define variables that need to be available in vi.mock
const { mockUpdateUserMetadata } = vi.hoisted(() => ({
  mockUpdateUserMetadata: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({
  createClerkClient: vi.fn(() => ({
    users: {
      updateUserMetadata: mockUpdateUserMetadata,
    },
  })),
}))

// Import after mocks
import { upsertUser } from '../user-sync'

// Mock prisma
vi.mock('../prisma', () => ({
  default: {
    user: {
      upsert: vi.fn(),
    },
    adminProfile: {
      upsert: vi.fn(),
    },
  },
}))

describe('upsertUser', () => {
  const adminEmail = 'admin@example.com'
  
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_EMAIL = adminEmail
  })

  it('should return null if clerkUser is null', async () => {
    const result = await upsertUser(null)
    expect(result).toBeNull()
  })

  it('should return null if clerkUser has no email', async () => {
    const clerkUser = { id: 'user_1', emailAddresses: [] }
    const result = await upsertUser(clerkUser)
    expect(result).toBeNull()
  })

  it('should upsert a regular user (CLIENT role)', async () => {
    const clerkUser = {
      id: 'user_1',
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'john@example.com' }],
      publicMetadata: { role: 'CLIENT' }
    }

    const dbUser = {
      id: 'db_user_1',
      clerkId: 'user_1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'CLIENT'
    }

    prisma.user.upsert.mockResolvedValue(dbUser)

    const result = await upsertUser(clerkUser)

    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { clerkId: 'user_1' },
      update: {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      create: {
        clerkId: 'user_1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CLIENT',
      },
    })
    expect(result).toEqual(dbUser)
    expect(mockUpdateUserMetadata).not.toHaveBeenCalled()
  })

  it('should upsert an admin user and create admin profile', async () => {
    const clerkUser = {
      id: 'admin_1',
      firstName: 'Admin',
      lastName: 'User',
      emailAddresses: [{ emailAddress: adminEmail }],
      publicMetadata: {}
    }

    const dbUser = {
      id: 'db_admin_1',
      clerkId: 'admin_1',
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN'
    }

    prisma.user.upsert.mockResolvedValue(dbUser)

    const result = await upsertUser(clerkUser)

    expect(prisma.user.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        role: 'ADMIN'
      })
    }))
    
    expect(prisma.adminProfile.upsert).toHaveBeenCalledWith({
      where: { userId: 'db_admin_1' },
      update: {},
      create: { userId: 'db_admin_1' },
    })

    expect(mockUpdateUserMetadata).toHaveBeenCalledWith('admin_1', {
      publicMetadata: { role: 'ADMIN' }
    })
    expect(result).toEqual(dbUser)
  })

  it('should update Clerk metadata if role in DB is different from Clerk metadata', async () => {
    const clerkUser = {
      id: 'user_1',
      emailAddresses: [{ emailAddress: 'john@example.com' }],
      publicMetadata: { role: 'CLIENT' }
    }

    // Role changed to ADMIN in DB (for some reason)
    const dbUser = {
      id: 'db_user_1',
      role: 'ADMIN'
    }

    prisma.user.upsert.mockResolvedValue(dbUser)

    await upsertUser(clerkUser)

    expect(mockUpdateUserMetadata).toHaveBeenCalledWith('user_1', {
      publicMetadata: { role: 'ADMIN' }
    })
  })
})
