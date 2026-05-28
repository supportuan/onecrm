import { prisma } from '../../prisma.js';
import { UserRole } from '@prisma/client';

const allowedRoles = [
  UserRole.ADMIN,
  UserRole.COUNSELLOR,
  UserRole.STUDENT,
  UserRole.HR,
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

export const createUser = async (data: {
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
}) => {
  if (!allowedRoles.includes(data.role)) {
    throw new Error('Invalid role selected');
  }

  return prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || null,
      role: data.role,
      isActive: true,
    },
  });
};

export const updateUser = async (
  id: number,
  data: {
    fullName?: string;
    phone?: string;
    role?: UserRole;
    isActive?: boolean;
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