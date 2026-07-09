import type { UserRole } from '@prisma/client';
import { prisma } from '../prisma.js';

/** Resolve tenant for newly provisioned users (students, etc.). */
export const getDefaultTenantId = async (fromUserId?: number | null): Promise<number | null> => {
  if (fromUserId) {
    const u = await prisma.user.findUnique({ where: { id: fromUserId }, select: { tenantId: true } });
    if (u?.tenantId) return u.tenantId;
  }

  const defaultTenant = await prisma.tenant.findUnique({
    where: { slug: 'default' },
    select: { id: true, status: true },
  });
  if (defaultTenant?.status === 'ACTIVE') return defaultTenant.id;

  const firstActive = await prisma.tenant.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  return firstActive?.id ?? null;
};

/** Backfill tenant for legacy users missing tenantId (e.g. old student logins). */
export const resolveTenantForUser = async (
  userId: number,
  role: UserRole,
): Promise<number | null> => {
  if (role === 'STUDENT') {
    const lead = await prisma.lead.findFirst({
      where: { studentUserId: userId },
      select: { assignedCounsellorId: true },
    });
    if (lead?.assignedCounsellorId) {
      const fromCounsellor = await getDefaultTenantId(lead.assignedCounsellorId);
      if (fromCounsellor) return fromCounsellor;
    }
  }

  return getDefaultTenantId();
};
