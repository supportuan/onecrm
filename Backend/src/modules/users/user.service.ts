import { prisma } from '../../prisma.js';
import { UserRole } from '@prisma/client';
import { hashPassword } from '../../utils/password.js';
import { sendCampaignEmail } from '../marketing/services/email.service.js';

const allowedRoles = [
  UserRole.ADMIN,
  UserRole.COUNSELLOR,
  UserRole.STUDENT,
  UserRole.HR,
  UserRole.AGENT,
];

export const getUsers = async (role?: UserRole) => {
  return prisma.user.findMany({
    where: {
      isActive: true,
      ...(role ? { role } : {}),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getUserById = async (id: number) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      isApproved: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const createUser = async (data: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  agencyDetails?: any;
}) => {
  if (!allowedRoles.includes(data.role)) {
    throw new Error('Invalid role selected');
  }

  const passwordHash = await hashPassword(data.password);
  const isApproved = data.role !== UserRole.AGENT;

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
    },
  });

  // Dispatch Welcome Email asynchronously so it does not block the response
  sendCampaignEmail({
    to: data.email,
    subject: 'Welcome to OneCRM - Your Account Details',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to OneCRM!</h2>
        <p style="color: #334155; font-size: 16px;">Hello <strong>${data.fullName}</strong>,</p>
        <p style="color: #334155; font-size: 14px;">Your account has been created successfully with the role of <strong>${data.role}</strong>.</p>
        <p style="color: #334155; font-size: 14px;">Here are your temporary login credentials:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
          <p style="margin: 5px 0; font-size: 14px; color: #1e293b;"><strong>Username (Email):</strong> ${data.email}</p>
          <p style="margin: 5px 0; font-size: 14px; color: #1e293b;"><strong>Temporary Password:</strong> ${data.password}</p>
        </div>
        <p style="color: #64748b; font-size: 13px;">Please note that you will be prompted to change this temporary password upon your first login for security reasons.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated email, please do not reply directly.</p>
      </div>
    `,
  }).catch((err) => {
    console.error('[Welcome Email Error] Failed to send email to:', data.email, err);
  });

  return user;
};

export const updateUser = async (
  id: number,
  data: {
    fullName?: string;
    phone?: string;
    role?: UserRole;
    isActive?: boolean;
    isApproved?: boolean;
    counsellorId?: number | null;
  }
) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

export const deactivateUser = async (id: number) => {
  return prisma.user.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
};

export const getCounsellors = async () => {
  return prisma.user.findMany({
    where: {
      role: UserRole.COUNSELLOR,
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
    },
    orderBy: {
      fullName: 'asc',
    },
  });
};