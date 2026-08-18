import type { UserRole } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { isAgencyPartnerUser } from '../agency-crm/scoping.js';

const FULL_ACCESS_ROLES: UserRole[] = ['SUPER_ADMIN', 'GLOBAL_ADMIN'];

export const hasFullCrmAccess = (role?: string) =>
  role != null && FULL_ACCESS_ROLES.includes(role as UserRole);

export const isStudentRole = (role?: string) => role === 'STUDENT';

type ScopeUser = {
  id?: number;
  role?: string;
  email?: string | null;
  tenantId?: number | null;
};

const withTenant = (where: Record<string, unknown>, user?: ScopeUser) => {
  // SUPER_ADMIN may operate cross-tenant; everyone else is pinned when known.
  if (user?.role === 'SUPER_ADMIN' || user?.tenantId == null) return where;
  return { ...where, tenantId: user.tenantId };
};

/** Match student rows linked by userId or legacy email-only records. */
export const studentSelfWhere = (user: ScopeUser) => {
  const or: Record<string, unknown>[] = [{ userId: user.id }];
  if (user.email) {
    or.push({ email: { equals: user.email, mode: 'insensitive' }, userId: null });
  }
  return withTenant({ deletedAt: null, OR: or }, user);
};

/** Counsellor: assigned records; Student: own profile/applications only */
export const applicationScopeWhere = (user?: ScopeUser) => {
  if (!user?.id || hasFullCrmAccess(user.role)) {
    return withTenant({}, user);
  }
  if (isStudentRole(user.role)) {
    return { student: studentSelfWhere(user) };
  }
  return withTenant({ assignedToId: user.id }, user);
};

export const studentScopeWhere = (user?: ScopeUser) => {
  if (!user?.id || hasFullCrmAccess(user.role)) {
    return withTenant({ deletedAt: null }, user);
  }
  if (isStudentRole(user.role)) return studentSelfWhere(user);
  return withTenant(
    {
      deletedAt: null,
      OR: [{ contactId: user.id }, { applications: { some: { assignedToId: user.id } } }],
    },
    user,
  );
};

/** Agency partners only see students referred to them. */
export const resolveStudentScopeWhere = async (user?: ScopeUser) => {
  if (!user?.id || hasFullCrmAccess(user.role)) {
    return withTenant({ deletedAt: null }, user);
  }
  if (isStudentRole(user.role)) return studentSelfWhere(user);
  if (isAgencyPartnerUser(user.role)) {
    const partner = await prisma.agencyPartner.findUnique({
      where: { userId: user.id },
      select: { id: true, agencyCode: true },
    });
    if (!partner) return { deletedAt: null, id: -1 };
    const or: Record<string, unknown>[] = [
      { agencyReferrals: { some: { agencyPartnerId: partner.id } } },
    ];
    if (partner.agencyCode) or.push({ source: partner.agencyCode });
    return withTenant({ deletedAt: null, OR: or }, user);
  }
  return studentScopeWhere(user);
};

export const resolveApplicationScopeWhere = async (user?: ScopeUser) => {
  if (!user?.id || hasFullCrmAccess(user.role)) {
    return withTenant({}, user);
  }
  if (isStudentRole(user.role)) return { student: studentSelfWhere(user) };
  if (isAgencyPartnerUser(user.role)) {
    const studentWhere = await resolveStudentScopeWhere(user);
    return { student: studentWhere };
  }
  return applicationScopeWhere(user);
};
