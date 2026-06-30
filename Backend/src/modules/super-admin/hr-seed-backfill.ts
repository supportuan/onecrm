import { UserRole } from '@prisma/client';
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

// Staff roles that should always have an HrEmployee record so HR self-service
// (clock-in, leave application, payslips) works for them.
const STAFF_ROLES: UserRole[] = [
  UserRole.GLOBAL_ADMIN,
  UserRole.HR,
  UserRole.COUNSELLOR,
  UserRole.MARKETING_MANAGER,
  UserRole.TELECALLER,
];

/**
 * Boot-time backfill: ensure every staff user in an HR-enabled tenant has a
 * linked HrEmployee row. Without this, staff created before the auto-provision
 * logic (or via the legacy seed) get "No HR employee record matches your login
 * email" when they try to apply for leave. Idempotent.
 */
export const backfillStaffEmployees = async (): Promise<void> => {
  const hrTenants = await prisma.tenantModule.findMany({
    where: { moduleKey: 'HR', enabled: true },
    select: { tenantId: true },
  });

  for (const { tenantId } of hrTenants) {
    const users = await prisma.user.findMany({
      where: { tenantId, role: { in: STAFF_ROLES } },
      select: { id: true, email: true, fullName: true, phone: true, role: true },
    });

    for (const u of users) {
      try {
        const existing = await prisma.hrEmployee.findFirst({
          where: { OR: [{ userId: u.id }, { email: u.email }] },
        });
        if (existing) {
          if (existing.userId == null) {
            await prisma.hrEmployee.update({
              where: { id: existing.id },
              data: { userId: u.id },
            });
          }
          continue;
        }
        await prisma.hrEmployee.create({
          data: {
            tenantId,
            userId: u.id,
            name: u.fullName,
            email: u.email,
            employeeCode: `EMP-T${tenantId}-U${u.id}`,
            phone: u.phone,
            accessRole:
              u.role === UserRole.GLOBAL_ADMIN || u.role === UserRole.HR
                ? 'HR_MANAGER'
                : 'EMPLOYEE',
          },
        });
        console.log(`[hr-seed] provisioned employee for user ${u.id} in tenant ${tenantId}`);
      } catch (err) {
        console.error(`[hr-seed] failed to provision employee for user ${u.id}`, err);
      }
    }
  }
};
