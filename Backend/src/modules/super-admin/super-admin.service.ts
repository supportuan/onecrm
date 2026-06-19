import { prisma } from '../../prisma.js';
import { hashPassword } from '../../utils/password.js';
import {
  invalidateTenantCache,
  setTenantModules,
} from '../rbac/tenant-modules.service.js';
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

  // Seed: enable selected modules, create initial admin, seed default
  // role->permission rows for this tenant (per-tenant rows arrive in Phase 5;
  // for now the global RolePermission table still applies to all tenants).
  await setTenantModules(tenant.id, input.modules);

  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      fullName: input.admin.fullName,
      email: input.admin.email,
      phone: input.admin.phone ?? null,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      isApproved: true,
    },
  });

  return { tenant, adminUserId: adminUser.id };
};

export const listTenants = async () => {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true } },
      modules: { where: { enabled: true }, select: { moduleKey: true } },
    },
  });
  return tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    status: t.status,
    userCount: t._count.users,
    enabledModules: t.modules.map((m) => m.moduleKey),
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
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    userCount: tenant._count.users,
    modules: tenant.modules,
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

// Phase 5 placeholder so the import wires cleanly; full per-tenant role
// editing UI ships then. For now we silently noop here.
export const _DEFAULT_ROLE_PERMS_REF = DEFAULT_ROLE_PERMISSIONS;
