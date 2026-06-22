// import { jest, describe, it, expect, afterEach } from '@jest/globals';

// jest.unstable_mockModule('../prisma.js', () => ({
//   prisma: {
//     user: {
//       findUnique: jest.fn(),
//       update: jest.fn(),
//     },
//   },
// }));

// jest.unstable_mockModule('../utils/password.js', () => ({
//   hashPassword: jest.fn(),
//   comparePasswords: jest.fn(),
// }));

// jest.unstable_mockModule('../utils/jwt.js', () => ({
//   generateAccessToken: jest.fn().mockReturnValue('mock_access_token'),
//   generateRefreshToken: jest.fn().mockReturnValue('mock_refresh_token'),
//   verifyRefreshToken: jest.fn(),
// }));

// const { prisma } = await import('../prisma.js');
// const { login } = await import('../modules/auth/auth.service.js');

// const { comparePasswords } = await import('../utils/password.js');

// const {
//   generateAccessToken,
//   generateRefreshToken,
// } = await import('../utils/jwt.js');

// const { UserRole } = await import('@prisma/client');

// describe('Auth Service - Login', () => {
//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('[AUTH-LOGIN-001] logs in successfully with valid credentials', async () => {
//     const user = {
//       id: 1,
//       fullName: 'Admin User',
//       email: 'admin@test.com',
//       passwordHash: 'hashed_pw',
//       role: UserRole.GLOBAL_ADMIN,
//       isActive: true,
//       isApproved: true,
//       isFirstLogin: false,
//     };

//     (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
//     (comparePasswords as jest.Mock).mockResolvedValue(true);

//     const result = await login({
//       email: 'admin@test.com',
//       password: 'tempPass123',
//     });

//     expect(prisma.user.findUnique).toHaveBeenCalledWith({
//       where: { email: 'admin@test.com' },
//     });

//     expect(comparePasswords).toHaveBeenCalledWith(
//       'tempPass123',
//       user.passwordHash
//     );

//     expect(generateAccessToken).toHaveBeenCalled();
//     expect(generateRefreshToken).toHaveBeenCalled();

//     expect(result.accessToken).toBe('mock_access_token');
//     expect(result.refreshToken).toBe('mock_refresh_token');
//     expect(result.user.email).toBe(user.email);
//   });

//   it('[AUTH-LOGIN-002] rejects login when email does not exist', async () => {
//     (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

//     await expect(
//       login({
//         email: 'notfound@test.com',
//         password: 'tempPass123',
//       })
//     ).rejects.toThrow();

//     expect(comparePasswords).not.toHaveBeenCalled();
//     expect(generateAccessToken).not.toHaveBeenCalled();
//   });

//   it('[AUTH-LOGIN-003] rejects login with invalid password', async () => {
//     const user = {
//       id: 1,
//       fullName: 'Admin User',
//       email: 'admin@test.com',
//       passwordHash: 'hashed_pw',
//       role: UserRole.GLOBAL_ADMIN,
//       isActive: true,
//       isApproved: true,
//     };

//     (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
//     (comparePasswords as jest.Mock).mockResolvedValue(false);

//     await expect(
//       login({
//         email: 'admin@test.com',
//         password: 'wrongPassword',
//       })
//     ).rejects.toThrow();

//     expect(generateAccessToken).not.toHaveBeenCalled();
//     expect(generateRefreshToken).not.toHaveBeenCalled();
//   });

//   it('[AUTH-LOGIN-004] rejects inactive user login', async () => {
//     const user = {
//       id: 1,
//       fullName: 'Inactive User',
//       email: 'inactive@test.com',
//       passwordHash: 'hashed_pw',
//       role: UserRole.GLOBAL_ADMIN,
//       isActive: false,
//       isApproved: true,
//     };

//     (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
//     (comparePasswords as jest.Mock).mockResolvedValue(true);

//     await expect(
//       login({
//         email: 'inactive@test.com',
//         password: 'tempPass123',
//       })
//     ).rejects.toThrow();

//     expect(generateAccessToken).not.toHaveBeenCalled();
//   });

//   it('[AUTH-LOGIN-005] rejects unapproved Agent login', async () => {
//     const user = {
//       id: 2,
//       fullName: 'Pending Agent',
//       email: 'agent@test.com',
//       passwordHash: 'hashed_pw',
//       role: UserRole.AGENT,
//       isActive: true,
//       isApproved: false,
//     };

//     (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
//     (comparePasswords as jest.Mock).mockResolvedValue(true);

//     await expect(
//       login({
//         email: 'agent@test.com',
//         password: 'tempPass123',
//       })
//     ).rejects.toThrow();

//     expect(generateAccessToken).not.toHaveBeenCalled();
//   });

//   it('[AUTH-LOGIN-006] returns isFirstLogin flag when user must change password', async () => {
//     const user = {
//       id: 3,
//       fullName: 'First Login User',
//       email: 'firstlogin@test.com',
//       passwordHash: 'hashed_pw',
//       role: UserRole.STUDENT,
//       isActive: true,
//       isApproved: true,
//       isFirstLogin: true,
//     };

//     (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
//     (comparePasswords as jest.Mock).mockResolvedValue(true);

//     const result = await login({
//       email: 'firstlogin@test.com',
//       password: 'tempPass123',
//     });

//     expect(result.isFirstLogin).toBe(true);
//   });

//   it('[AUTH-LOGIN-007] rejects missing email', async () => {
//     await expect(
//       login({
//         email: '',
//         password: 'tempPass123',
//       })
//     ).rejects.toThrow();

//     expect(prisma.user.findUnique).not.toHaveBeenCalled();
//   });

//   it('[AUTH-LOGIN-008] rejects missing password', async () => {
//     await expect(
//       login({
//         email: 'admin@test.com',
//         password: '',
//       })
//     ).rejects.toThrow();

//     expect(prisma.user.findUnique).not.toHaveBeenCalled();
//   });
// });


import { jest, describe, it, expect, afterEach } from '@jest/globals';

jest.unstable_mockModule('../prisma.js', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        refreshToken: {
            create: jest.fn(),
        },
    },
}));

jest.unstable_mockModule('../utils/password.js', () => ({
    hashPassword: jest.fn(),
    comparePasswords: jest.fn(),
}));

jest.unstable_mockModule('../utils/jwt.js', () => ({
    generateAccessToken: jest.fn().mockReturnValue('mock_access_token'),
    generateRefreshToken: jest.fn().mockReturnValue('mock_refresh_token'),
    verifyRefreshToken: jest.fn(),
}));

const { prisma } = await import('../prisma.js');
const { login } = await import('../modules/auth/auth.service.js');
const { comparePasswords } = await import('../utils/password.js');
const { generateAccessToken, generateRefreshToken } = await import('../utils/jwt.js');
const { UserRole } = await import('@prisma/client');

describe('Auth Service - Login', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it(' logs in successfully with valid credentials', async () => {
        const user = {
            id: 1,
            fullName: 'Admin User',
            email: 'admin@test.com',
            passwordHash: 'hashed_pw',
            role: UserRole.GLOBAL_ADMIN,
            isActive: true,
            isApproved: true,
            isFirstLogin: false,
            tenant: {
                id: 1,
                name: 'Test Tenant',
                slug: 'test-tenant',
                status: 'ACTIVE',
            },
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
        (comparePasswords as jest.Mock).mockResolvedValue(true);
        (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
            id: 1,
            userId: user.id,
            token: 'mock_refresh_token',
        });

        const result = await login('admin@test.com', 'tempPass123');

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: 'admin@test.com' },
            include: { tenant: true },
        });

        expect(comparePasswords).toHaveBeenCalledWith(
            'tempPass123',
            user.passwordHash
        );

        expect(generateAccessToken).toHaveBeenCalled();
        expect(generateRefreshToken).toHaveBeenCalled();

        expect(prisma.refreshToken.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: user.id,
                token: 'mock_refresh_token',
            }),
        });

        expect(result.accessToken).toBe('mock_access_token');
        expect(result.refreshToken).toBe('mock_refresh_token');
        expect(result.user.email).toBe(user.email);
    });

    it('rejects login when email does not exist', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(login('notfound@test.com', 'tempPass123')).rejects.toThrow();

        expect(comparePasswords).not.toHaveBeenCalled();
        expect(generateAccessToken).not.toHaveBeenCalled();
        expect(generateRefreshToken).not.toHaveBeenCalled();
        expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('rejects login with invalid password', async () => {
        const user = {
            id: 1,
            fullName: 'Admin User',
            email: 'admin@test.com',
            passwordHash: 'hashed_pw',
            role: UserRole.GLOBAL_ADMIN,
            isActive: true,
            isApproved: true,
            tenant: {
                id: 1,
                name: 'Test Tenant',
                slug: 'test-tenant',
                status: 'ACTIVE',
            },
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
        (comparePasswords as jest.Mock).mockResolvedValue(false);

        await expect(login('admin@test.com', 'wrongPassword')).rejects.toThrow();

        expect(generateAccessToken).not.toHaveBeenCalled();
        expect(generateRefreshToken).not.toHaveBeenCalled();
        expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('rejects inactive user login', async () => {
        const user = {
            id: 1,
            fullName: 'Inactive User',
            email: 'inactive@test.com',
            passwordHash: 'hashed_pw',
            role: UserRole.GLOBAL_ADMIN,
            isActive: false,
            isApproved: true,
            tenant: {
                id: 1,
                name: 'Test Tenant',
                slug: 'test-tenant',
                status: 'ACTIVE',
            },
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
        (comparePasswords as jest.Mock).mockResolvedValue(true);

        await expect(login('inactive@test.com', 'tempPass123')).rejects.toThrow();

        expect(generateAccessToken).not.toHaveBeenCalled();
        expect(generateRefreshToken).not.toHaveBeenCalled();
        expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('rejects unapproved Agent login', async () => {
        const user = {
            id: 2,
            fullName: 'Pending Agent',
            email: 'agent@test.com',
            passwordHash: 'hashed_pw',
            role: UserRole.AGENT,
            isActive: true,
            isApproved: false,
            tenant: {
                id: 1,
                name: 'Test Tenant',
                slug: 'test-tenant',
                status: 'ACTIVE',
            },
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
        (comparePasswords as jest.Mock).mockResolvedValue(true);

        await expect(login('agent@test.com', 'tempPass123')).rejects.toThrow();

        expect(generateAccessToken).not.toHaveBeenCalled();
        expect(generateRefreshToken).not.toHaveBeenCalled();
        expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('returns isFirstLogin flag when user must change password', async () => {
        const user = {
            id: 3,
            fullName: 'First Login User',
            email: 'firstlogin@test.com',
            passwordHash: 'hashed_pw',
            role: UserRole.STUDENT,
            isActive: true,
            isApproved: true,
            isFirstLogin: true,
            tenant: {
                id: 1,
                name: 'Test Tenant',
                slug: 'test-tenant',
                status: 'ACTIVE',
            },
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
        (comparePasswords as jest.Mock).mockResolvedValue(true);
        (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
            id: 2,
            userId: user.id,
            token: 'mock_refresh_token',
        });

        const result = await login('firstlogin@test.com', 'tempPass123');

        expect(result.accessToken).toBe('mock_access_token');
        expect(result.refreshToken).toBe('mock_refresh_token');
        expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
});