import type { UserRole } from '@prisma/client';

const FULL_ACCESS_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN'];

export const hasFullAgencyAccess = (role?: string) =>
  role != null && FULL_ACCESS_ROLES.includes(role as UserRole);

export const isAgencyFreelancer = (role?: string) => role === 'AGENCY_FREELANCER';
