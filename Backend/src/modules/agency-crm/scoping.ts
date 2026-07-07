import type { UserRole } from '@prisma/client';

const FULL_ACCESS_ROLES: UserRole[] = ['SUPER_ADMIN', 'GLOBAL_ADMIN'];

export const hasFullAgencyAccess = (role?: string) =>
  role != null && FULL_ACCESS_ROLES.includes(role as UserRole);

export const isAgencyPartnerUser = (role?: string) =>
  role === 'AGENCY_FREELANCER' || role === 'AGENT';

/** @deprecated use isAgencyPartnerUser */
export const isAgencyFreelancer = isAgencyPartnerUser;
