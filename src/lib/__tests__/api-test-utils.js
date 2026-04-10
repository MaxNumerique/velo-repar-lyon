import { vi } from 'vitest';

/**
 * Creates a mock Next.js Request object.
 * @param {Object} options - Request options.
 * @param {string} [options.url='http://localhost/api/test'] - The request URL.
 * @param {string} [options.method='GET'] - The HTTP method.
 * @param {Object} [options.body] - The JSON body of the request.
 * @returns {Request}
 */
export function createMockRequest({ url = 'http://localhost/api/test', method = 'GET', body } = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return new Request(url, options);
}

/**
 * Mocks an Admin session by stubbing Clerk's auth() and Prisma's user.findUnique.
 * @param {Object} mocks - The mock objects for Clerk and Prisma.
 * @param {Object} [adminData] - Optional custom admin user data.
 * @param {Object} [targetUser] - Optional user data for the second call to findUnique (useful for /id/ routes).
 */
export function mockAdminSession(clerkMock, prismaMock, adminData = {}, targetUser = null) {
  const defaultAdmin = {
    id: 'admin-123',
    clerkId: 'user_admin_123',
    role: 'ADMIN',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    ...adminData,
  };

  clerkMock.auth.mockResolvedValue({ userId: defaultAdmin.clerkId });
  
  // Smart mock for findUnique
  prismaMock.user.findUnique.mockImplementation(({ where }) => {
    if (where.clerkId === defaultAdmin.clerkId || where.clerkId === 'clerk-admin') {
      return Promise.resolve(defaultAdmin);
    }
    if (targetUser && where.id) {
        return Promise.resolve(targetUser);
    }
    // Default fallback
    return Promise.resolve(defaultAdmin);
  });
}

export function mockRestrictedSession(clerkMock, prismaMock, role = null) {
  if (!role) {
    clerkMock.auth.mockResolvedValue({ userId: null });
  } else {
    const user = {
      id: 'user-456',
      clerkId: 'user_restricted_456',
      role: role,
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
    };
    clerkMock.auth.mockResolvedValue({ userId: user.clerkId });
    prismaMock.user.findUnique.mockResolvedValue(user);
  }
}
