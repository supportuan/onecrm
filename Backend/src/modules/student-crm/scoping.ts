import type { UserRole } from '@prisma/client';

const FULL_ACCESS_ROLES: UserRole[] = ['SUPER_ADMIN', 'GLOBAL_ADMIN'];

export const hasFullCrmAccess = (role?: string) =>
  role != null && FULL_ACCESS_ROLES.includes(role as UserRole);

export const isStudentRole = (role?: string) => role === 'STUDENT';

/** Counsellor: assigned records; Student: own profile/applications only */
export const applicationScopeWhere = (user?: { id?: number; role?: string }) => {
  if (!user?.id || hasFullCrmAccess(user.role)) return {};
  if (isStudentRole(user.role)) {
    return { student: { userId: user.id, deletedAt: null } };
  }
  return { assignedToId: user.id };
};

export const studentScopeWhere = (user?: { id?: number; role?: string }) => {
  if (!user?.id || hasFullCrmAccess(user.role)) return { deletedAt: null };
  if (isStudentRole(user.role)) return { deletedAt: null, userId: user.id };
  return {
    deletedAt: null,
    OR: [{ contactId: user.id }, { applications: { some: { assignedToId: user.id } } }],
  };
};
