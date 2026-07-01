import { prisma } from '../../prisma.js';
import { seedHrDefaults } from './super-admin.service.js';

/**
 * Boot-time backfill: for any tenant that has the HR module enabled but no
 * HrLeaveType rows yet, run the default seed. Idempotent — tenants that
 * already have leave types are skipped.
 */
export const backfillHrSeedsForExistingTenants = async (): Promise<void> => {
  const hrTenants = await prisma.tenantModule.findMany({
    where: { moduleKey: 'HR', enabled: true },
    select: { tenantId: true },
  });

  for (const { tenantId } of hrTenants) {
    const hasTypes = await prisma.hrLeaveType.findFirst({ where: { tenantId } });
    if (hasTypes) continue;
    try {
      await seedHrDefaults(tenantId);
      console.log(`[hr-seed] backfilled defaults for tenant ${tenantId}`);
    } catch (err) {
      console.error(`[hr-seed] failed to backfill tenant ${tenantId}`, err);
    }
  }
};
