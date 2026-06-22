import { prisma } from '../../prisma.js';

export type SuperAdminAction =
  | 'tenant.create'
  | 'tenant.update'
  | 'tenant.setModules'
  | 'tenant.resetAdminPassword';

export const logSuperAdminAction = async (
  actorId: number,
  action: SuperAdminAction,
  targetTenantId: number | null,
  payload?: unknown,
): Promise<void> => {
  try {
    await prisma.superAdminAudit.create({
      data: {
        actorId,
        action,
        targetTenantId: targetTenantId ?? null,
        payload: (payload ?? null) as any,
      },
    });
  } catch (err) {
    // Audit logging must never break the actual operation.
    console.error('[audit] failed to write SuperAdminAudit', { action, err });
  }
};

export const listAudits = async (limit = 200) => {
  return prisma.superAdminAudit.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 1000),
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });
};
