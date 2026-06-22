import type { UserRole } from '@prisma/client';

const FULL_ACCESS_ROLES: UserRole[] = ['SUPER_ADMIN', 'GLOBAL_ADMIN'];

export const hasFullCrmAccess = (role?: string) =>
  role != null && FULL_ACCESS_ROLES.includes(role as UserRole);

/** Counsellor/agent: only records assigned to them */
export const applicationScopeWhere = (user?: { id?: number; role?: string }) => {
  if (!user?.id || hasFullCrmAccess(user.role)) return {};
  return { assignedToId: user.id };
};

export const studentScopeWhere = (user?: { id?: number; role?: string }) => {
  if (!user?.id || hasFullCrmAccess(user.role)) return { deletedAt: null };
  return { deletedAt: null, OR: [{ contactId: user.id }, { applications: { some: { assignedToId: user.id } } }] };
};
