import { prisma } from '../prisma.js';

/** Resolve tenant for newly provisioned users (students, etc.). */
export const getDefaultTenantId = async (fromUserId?: number | null): Promise<number | null> => {
  if (fromUserId) {
    const u = await prisma.user.findUnique({ where: { id: fromUserId }, select: { tenantId: true } });
    if (u?.tenantId) return u.tenantId;
  }
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'default' }, select: { id: true } });
  return tenant?.id ?? null;
};
