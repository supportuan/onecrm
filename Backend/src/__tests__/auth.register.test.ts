
import { jest, describe, it, expect, afterEach } from '@jest/globals';

jest.unstable_mockModule('../prisma.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.unstable_mockModule('../utils/password.js', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_pw'),
  comparePasswords: jest.fn(),
}));

jest.unstable_mockModule('../utils/jwt.js', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

jest.unstable_mockModule('../modules/marketing/services/email.service.js', () => ({
  adminAgentNotification: jest.fn().mockResolvedValue(undefined),
  adminStudentNotification: jest.fn().mockResolvedValue(undefined),
  sendCampaignEmail: jest.fn().mockResolvedValue(undefined),
}));

const { prisma } = await import('../prisma.js');
const { register } = await import('../modules/auth/auth.service.js');

const {
  adminAgentNotification,
  adminStudentNotification,
  sendCampaignEmail,
} = await import('../modules/marketing/services/email.service.js');

const { hashPassword } = await import('../utils/password.js');
const { UserRole } = await import('@prisma/client');

describe('Auth Service - register', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers a Student with approval and sends student/admin emails', async () => {
    const data = {
      fullName: 'Alice Student',
      email: 'alice@student.com',
      phone: '9999999999',
      password: 'tempPass123',
      role: UserRole.STUDENT,
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 1,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      isActive: true,
      isApproved: true,
      passwordHash: 'hashed_pw',
    });

    const user = await register(data);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: data.email },
    });

    expect(hashPassword).toHaveBeenCalledWith(data.password);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: UserRole.STUDENT,
        isActive: true,
        isApproved: true,
        passwordHash: 'hashed_pw',
      }),
    });

    expect(adminStudentNotification).toHaveBeenCalled();
    expect(sendCampaignEmail).toHaveBeenCalled();
    expect(adminAgentNotification).not.toHaveBeenCalled();

    expect(user.isApproved).toBe(true);
  });

  it('registers an Agent with pending approval and sends agent/admin emails', async () => {
    const data = {
      fullName: 'Bob Agent',
      email: 'bob@agent.com',
      phone: '8888888888',
      password: 'tempPass123',
      role: UserRole.AGENT,
      agencyDetails: {
        agencyName: 'Bob Consultancy',
      },
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 2,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      isActive: true,
      isApproved: false,
      agencyDetails: data.agencyDetails,
      passwordHash: 'hashed_pw',
    });

    const user = await register(data);

    expect(hashPassword).toHaveBeenCalledWith(data.password);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: UserRole.AGENT,
        isActive: true,
        isApproved: false,
        agencyDetails: data.agencyDetails,
        passwordHash: 'hashed_pw',
      }),
    });

    expect(adminAgentNotification).toHaveBeenCalled();
    expect(sendCampaignEmail).toHaveBeenCalled();
    expect(adminStudentNotification).not.toHaveBeenCalled();

    expect(user.isApproved).toBe(false);
  });

  it('throws error when email already exists', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 10,
      email: 'existing@test.com',
    });

    await expect(
      register({
        fullName: 'Existing User',
        email: 'existing@test.com',
        password: 'tempPass123',
        role: UserRole.STUDENT,
      })
    ).rejects.toThrow('Email already registered');

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(adminStudentNotification).not.toHaveBeenCalled();
    expect(adminAgentNotification).not.toHaveBeenCalled();
  });

  it('does not create user when password hashing fails', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    (hashPassword as jest.Mock).mockRejectedValueOnce(
      new Error('Password hashing failed')
    );

    await expect(
      register({
        fullName: 'Hash Fail User',
        email: 'hashfail@test.com',
        password: 'tempPass123',
        role: UserRole.STUDENT,
      })
    ).rejects.toThrow('Password hashing failed');

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(adminStudentNotification).not.toHaveBeenCalled();
    expect(adminAgentNotification).not.toHaveBeenCalled();
  });

  it('throws error when database user creation fails', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    (prisma.user.create as jest.Mock).mockRejectedValueOnce(
      new Error('Database create failed')
    );

    await expect(
      register({
        fullName: 'DB Fail User',
        email: 'dbfail@test.com',
        password: 'tempPass123',
        role: UserRole.STUDENT,
      })
    ).rejects.toThrow('Database create failed');

    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(adminStudentNotification).not.toHaveBeenCalled();
    expect(adminAgentNotification).not.toHaveBeenCalled();
  });

  it('creates Student as active and approved by default', async () => {
    const data = {
      fullName: 'Active Student',
      email: 'active@student.com',
      password: 'tempPass123',
      role: UserRole.STUDENT,
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 7,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      isActive: true,
      isApproved: true,
      passwordHash: 'hashed_pw',
    });

    const user = await register(data);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isActive: true,
        isApproved: true,
      }),
    });

    expect(user.isActive).toBe(true);
    expect(user.isApproved).toBe(true);
  });

  it('creates Agent as active but not approved by default', async () => {
    const data = {
      fullName: 'Pending Agent',
      email: 'pending@agent.com',
      password: 'tempPass123',
      role: UserRole.AGENT,
      agencyDetails: {
        agencyName: 'Pending Agency',
      },
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 8,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      agencyDetails: data.agencyDetails,
      isActive: true,
      isApproved: false,
      passwordHash: 'hashed_pw',
    });

    const user = await register(data);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isActive: true,
        isApproved: false,
      }),
    });

    expect(user.isActive).toBe(true);
    expect(user.isApproved).toBe(false);
  });

  it('does not send agent notification for Student registration', async () => {
    const data = {
      fullName: 'Student Only',
      email: 'studentonly@test.com',
      password: 'tempPass123',
      role: UserRole.STUDENT,
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 5,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      isActive: true,
      isApproved: true,
      passwordHash: 'hashed_pw',
    });

    await register(data);

    expect(adminStudentNotification).toHaveBeenCalledTimes(1);
    expect(adminAgentNotification).not.toHaveBeenCalled();
  });

  it('does not send student notification for Agent registration', async () => {
    const data = {
      fullName: 'Agent Only',
      email: 'agentonly@test.com',
      password: 'tempPass123',
      role: UserRole.AGENT,
      agencyDetails: {
        agencyName: 'Agent Agency',
      },
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 6,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      agencyDetails: data.agencyDetails,
      isActive: true,
      isApproved: false,
      passwordHash: 'hashed_pw',
    });

    await register(data);

    expect(adminAgentNotification).toHaveBeenCalledTimes(1);
    expect(adminStudentNotification).not.toHaveBeenCalled();
  });




});