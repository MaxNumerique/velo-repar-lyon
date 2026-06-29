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
  prismaMock.user.findUnique.mockImplementation(({ where }) => {
    if (where.clerkId === defaultAdmin.clerkId || where.clerkId === 'clerk-admin') {
      return Promise.resolve(defaultAdmin);
    }
    if (targetUser && where.id) {
        return Promise.resolve(targetUser);
    }
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
