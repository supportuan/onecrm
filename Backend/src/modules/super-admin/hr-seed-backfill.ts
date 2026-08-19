import { UserRole } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { hrAccessRoleDefaults, userRoleToHrAccessRole } from '../hr/hr-access-role.js';

export const seedHrDefaults = async () => {
  const existingSettings = await prisma.hrAttendanceSetting.findFirst();
  if (!existingSettings) {
    await prisma.hrAttendanceSetting.create({
      data: { attendanceMode: 'biometric', enableIpValidation: false },
    });
  }

  const types = [
    { code: 'AL', name: 'Annual Leave' },
    { code: 'SL', name: 'Sick Leave' },
    { code: 'CL', name: 'Casual Leave' },
  ];
  const created: Record<string, number> = {};
  for (const t of types) {
    const row = await prisma.hrLeaveType.upsert({
      where: { code: t.code },
      create: { code: t.code, name: t.name },
      update: {},
    });
    created[t.code] = row.id;
  }

  const existingPlan = await prisma.hrLeavePlan.findFirst({
    where: { name: 'Standard Plan' },
  });
  const plan =
    existingPlan ??
    (await prisma.hrLeavePlan.create({
      data: {
        name: 'Standard Plan',
        description: 'Default leave plan — adjust quotas before assigning to employees.',
      },
    }));

  for (const t of types) {
    await prisma.hrLeaveDefinition.upsert({
      where: { planId_leaveTypeId: { planId: plan.id, leaveTypeId: created[t.code] } },
      create: {
        planId: plan.id,
        leaveTypeId: created[t.code],
        name: t.name,
        annualQuota: t.code === 'AL' ? 18 : t.code === 'SL' ? 12 : 6,
        carryForward: t.code === 'AL',
      },
      update: {},
    });
  }
};

const STAFF_ROLES: UserRole[] = [
  UserRole.GLOBAL_ADMIN,
  UserRole.HR,
  UserRole.COUNSELLOR,
  UserRole.MARKETING_MANAGER,
  UserRole.TELECALLER,
];

export const backfillHrSeedsForExistingTenants = async (): Promise<void> => {
  const hasTypes = await prisma.hrLeaveType.findFirst();
  if (!hasTypes) {
    await seedHrDefaults();
    console.log('[hr-seed] backfilled leave defaults');
  }
};

export const backfillStaffEmployees = async (): Promise<void> => {
  const users = await prisma.user.findMany({
    where: { role: { in: STAFF_ROLES } },
    select: { id: true, email: true, fullName: true, phone: true, role: true },
  });

  for (const u of users) {
    try {
      const existing = await prisma.hrEmployee.findFirst({
        where: { OR: [{ userId: u.id }, { email: { equals: u.email, mode: 'insensitive' } }] },
      });
      if (existing) {
        const patch: Record<string, unknown> = {};
        if (existing.userId == null) patch.userId = u.id;
        const accessRole = userRoleToHrAccessRole(u.role);
        if (accessRole !== existing.accessRole) {
          patch.accessRole = accessRole;
          Object.assign(patch, hrAccessRoleDefaults(accessRole));
        }
        if (Object.keys(patch).length) {
          await prisma.hrEmployee.update({ where: { id: existing.id }, data: patch });
        }
        continue;
      }

      await prisma.hrEmployee.create({
        data: {
          userId: u.id,
          name: u.fullName,
          email: u.email,
          employeeCode: `EMP-U${u.id}`,
          phone: u.phone,
          accessRole: userRoleToHrAccessRole(u.role),
          ...hrAccessRoleDefaults(userRoleToHrAccessRole(u.role)),
        },
      });
      console.log(`[hr-seed] provisioned employee for user ${u.id}`);
    } catch (err) {
      console.error(`[hr-seed] failed for user ${u.id}`, err);
    }
  }
};
