import { prisma } from '../../prisma.js';
import { hashPassword } from '../../utils/password.js';
import {
  invalidateTenantCache,
  setTenantModules,
} from '../rbac/tenant-modules.service.js';
import { seedTenantDefaults } from '../rbac/rbac.service.js';
import {
  DEFAULT_ROLE_PERMISSIONS,
  ModuleKey,
} from '../rbac/rbac.constants.js';

interface CreateTenantInput {
  name: string;
  slug: string;
  modules: ModuleKey[];
  admin: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  };
}

export const createTenant = async (input: CreateTenantInput) => {
  // Validate uniqueness up front for nicer errors.
  const [slugClash, emailClash] = await Promise.all([
    prisma.tenant.findUnique({ where: { slug: input.slug } }),
    prisma.user.findUnique({ where: { email: input.admin.email } }),
  ]);
  if (slugClash) throw new Error('Tenant slug already in use');
  if (emailClash) throw new Error('Admin email already in use');

  const passwordHash = await hashPassword(input.admin.password);

  const tenant = await prisma.tenant.create({
    data: { name: input.name, slug: input.slug },
  });

  // Seed: enable selected modules, copy default role->permission rows, create
  // the initial admin. The RBAC cache is invalidated for this tenant inside
  // seedTenantDefaults().
  await setTenantModules(tenant.id, input.modules);
  await seedTenantDefaults(tenant.id);

  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      fullName: input.admin.fullName,
      email: input.admin.email,
      phone: input.admin.phone ?? null,
      passwordHash,
      role: 'GLOBAL_ADMIN',
      isActive: true,
      isApproved: true,
      // Force the client to rotate the super-admin-set password on first login.
      mustChangePassword: true,
    },
  });

  // Module-specific seed data so the tenant lands on a usable, non-empty UI.
  if (input.modules.includes('HR' as ModuleKey)) {
    await seedHrDefaults(tenant.id);
  }

  return { tenant, adminUserId: adminUser.id };
};

// Minimum data a fresh HR tenant needs before screens stop being empty.
// Holidays are intentionally skipped — every org has its own calendar.
const seedHrDefaults = async (tenantId: number) => {
  // 1. Attendance setting row
  await prisma.hrAttendanceSetting.upsert({
    where: { tenantId },
    create: { tenantId, attendanceMode: 'biometric', enableIpValidation: false },
    update: {},
  });

  // 2. Default leave types (per-tenant code uniqueness now allows this safely)
  const types = [
    { code: 'AL', name: 'Annual Leave' },
    { code: 'SL', name: 'Sick Leave' },
    { code: 'CL', name: 'Casual Leave' },
  ];
  const created: Record<string, number> = {};
  for (const t of types) {
    const row = await prisma.hrLeaveType.upsert({
      where: { tenantId_code: { tenantId, code: t.code } },
      create: { tenantId, code: t.code, name: t.name },
      update: {},
    });
    created[t.code] = row.id;
  }

  // 3. One starter leave plan with all three definitions
  const existingPlan = await prisma.hrLeavePlan.findFirst({
    where: { tenantId, name: 'Standard Plan' },
  });
  const plan =
    existingPlan ??
    (await prisma.hrLeavePlan.create({
      data: {
        tenantId,
        name: 'Standard Plan',
        description: 'Default leave plan — adjust quotas before assigning to employees.',
      },
    }));

  for (const t of types) {
    await prisma.hrLeaveDefinition.upsert({
      where: { planId_leaveTypeId: { planId: plan.id, leaveTypeId: created[t.code] } },
      create: {
        tenantId,
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

// Returns the first ADMIN-role user in a tenant — the "primary admin" the
// super admin handed credentials to during onboarding.
const findPrimaryAdmin = async (tenantId: number) => {
  return prisma.user.findFirst({
    where: { tenantId, role: 'GLOBAL_ADMIN' },
    orderBy: { id: 'asc' },
    select: { id: true, fullName: true, email: true, phone: true, isActive: true, lastLogin: true },
  });
};

export const listTenants = async () => {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true } },
      modules: { where: { enabled: true }, select: { moduleKey: true } },
    },
  });
  const admins = await Promise.all(tenants.map((t) => findPrimaryAdmin(t.id)));
  return tenants.map((t, i) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    status: t.status,
    userCount: t._count.users,
    enabledModules: t.modules.map((m) => m.moduleKey),
    primaryAdmin: admins[i],
    createdAt: t.createdAt,
  }));
};

export const getTenant = async (id: number) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true } },
      modules: { select: { moduleKey: true, enabled: true } },
    },
  });
  if (!tenant) return null;
  const primaryAdmin = await findPrimaryAdmin(tenant.id);
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    userCount: tenant._count.users,
    modules: tenant.modules,
    primaryAdmin,
    createdAt: tenant.createdAt,
  };
};

export const updateTenant = async (
  id: number,
  data: { name?: string; status?: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' },
) => {
  const tenant = await prisma.tenant.update({ where: { id }, data });
  invalidateTenantCache(id);
  return tenant;
};

export const updateTenantModules = async (id: number, modules: ModuleKey[]) => {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) throw new Error('Tenant not found');
  await setTenantModules(id, modules);
  return getTenant(id);
};

// Generate a reasonably strong throwaway password the super admin can hand
// over once. The client should change it on first login.
const generatePassword = (): string => {
  const charset =
    'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 14; i++) {
    out += charset[Math.floor(Math.random() * charset.length)];
  }
  return out;
};

export const resetPrimaryAdminPassword = async (
  tenantId: number,
  providedPassword?: string,
): Promise<{ email: string; password: string }> => {
  const admin = await prisma.user.findFirst({
    where: { tenantId, role: 'GLOBAL_ADMIN' },
    orderBy: { id: 'asc' },
  });
  if (!admin) throw new Error('Primary admin not found for this tenant');

  const newPassword =
    providedPassword && providedPassword.length >= 8
      ? providedPassword
      : generatePassword();
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash, mustChangePassword: true },
  });

  return { email: admin.email, password: newPassword };
};

// Phase 5 placeholder so the import wires cleanly; full per-tenant role
// editing UI ships then. For now we silently noop here.
export const _DEFAULT_ROLE_PERMS_REF = DEFAULT_ROLE_PERMISSIONS;
