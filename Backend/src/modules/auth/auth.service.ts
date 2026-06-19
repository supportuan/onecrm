import { prisma } from '../../prisma.js';
import { UserRole } from '@prisma/client';
import { hashPassword, comparePasswords } from '../../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { adminAgentNotification, adminStudentNotification, sendCampaignEmail } from '../marketing/services/email.service.js';
import { safeNotify } from '../notifications/recipients.js';

interface RegisterData {
  fullName: string;
  email: string;
  phone?: string | null;
  password: string;
  role: UserRole;
  agencyDetails?: any;
}

export const register = async (data: RegisterData) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('Email already registered');

  const passwordHash = await hashPassword(data.password);
  const isApproved = data.role !== UserRole.AGENT;

  // Import default permissions for the role
  const { getDefaultModuleAccessByRole } = await import('../users/user.service.js');
  const moduleAccess = getDefaultModuleAccessByRole(data.role);

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || null,
      passwordHash,
      role: data.role,
      isActive: true,
      isApproved,
      agencyDetails: data.agencyDetails || null,
      moduleAccess: moduleAccess || null,
    },
  });

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || 'admin@onecrm.com';

  if (data.role === UserRole.AGENT) {
    // Notify admin
    adminAgentNotification({
      to: adminEmail,
      agentName: data.fullName,
      agentEmail: data.email,
    }).catch(err => console.error('[Admin Agent Notification Error]', err));

    // Send Welcome Email to Agent
    sendCampaignEmail({
      to: data.email,
      subject: 'Agent Registration Received - Awaiting Approval',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to OneCRM!</h2>
          <p style="color: #334155; font-size: 16px;">Hello <strong>${data.fullName}</strong>,</p>
          <p style="color: #334155; font-size: 14px;">Your agent registration has been received successfully.</p>
          <p style="color: #334155; font-size: 14px;">Please note that agent accounts require admin approval before you can log in. You will receive an email confirmation once your account has been approved.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated email, please do not reply directly.</p>
        </div>
      `,
    }).catch(err => console.error('[Agent Welcome Email Error]', err));
  } else if (data.role === UserRole.STUDENT) {
    // Notify admin
    adminStudentNotification({
      to: adminEmail,
      studentName: data.fullName,
      studentEmail: data.email,
    }).catch(err => console.error('[Admin Student Notification Error]', err));

    // Send Welcome Email to Student
    sendCampaignEmail({
      to: data.email,
      subject: 'Welcome to OneCRM - Student Account Registered',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to OneCRM!</h2>
          <p style="color: #334155; font-size: 16px;">Hello <strong>${data.fullName}</strong>,</p>
          <p style="color: #334155; font-size: 14px;">Your student registration has been created successfully.</p>
          <p style="color: #334155; font-size: 14px;">An admin will assign a counsellor to assist you shortly. You can log in using your email and password.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated email, please do not reply directly.</p>
        </div>
      `,
    }).catch(err => console.error('[Student Welcome Email Error]', err));
  }

  if (isApproved) {
    await safeNotify({
      recipientId: user.id,
      templateKey: 'welcome.user',
      vars: { name: user.fullName, role: user.role },
    });
  }

  return user;
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  });
  if (!user || !user.isActive) throw new Error('Invalid credentials');

  const isValid = await comparePasswords(password, user.passwordHash);
  if (!isValid) throw new Error('Invalid credentials');

  if (user.role === UserRole.AGENT && !user.isApproved) {
    throw new Error('Agent account has not been approved by an administrator yet');
  }

  // Tenant gate: SUPER_ADMIN has no tenant; everyone else must belong to an
  // ACTIVE tenant. Suspended or archived → login refused with a clear reason.
  if (user.role !== UserRole.SUPER_ADMIN) {
    if (!user.tenant) {
      throw new Error('User is not associated with any tenant');
    }
    if (user.tenant.status !== 'ACTIVE') {
      throw new Error(`Tenant is ${user.tenant.status.toLowerCase()}; contact your administrator`);
    }
  }

  const isFirstLogin = user.lastLogin === null;

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId ?? null,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  return { user, accessToken, refreshToken, isFirstLogin };
};

export const refreshToken = async (token: string) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new Error('Invalid refresh token');
  }

  const payload = verifyRefreshToken(token);

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || !user.isActive) throw new Error('Invalid refresh token');

  const tokenPayload = { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId ?? null };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  await prisma.refreshToken.deleteMany({
    where: { userId: user.id, token: { not: refreshToken } },
  });

  return { accessToken, refreshToken };
};

export const logout = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

export const getUserProfile = async (id: number) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      tenantId: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      moduleAccess: true,
    },
  });
};

export const changePassword = async (userId: number, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const isValid = await comparePasswords(currentPassword, user.passwordHash);
  if (!isValid) throw new Error('Current password is incorrect');

  const passwordHash = await hashPassword(newPassword);
  return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
};

export const createPasswordResetToken = async (email: string, token: string, expiresAt: Date) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Email not found');

  return prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });
};

export const verifyPasswordResetToken = async (token: string) => {
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.expiresAt < new Date()) throw new Error('Invalid or expired reset token');
  return resetToken;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const resetToken = await verifyPasswordResetToken(token);
  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
};
