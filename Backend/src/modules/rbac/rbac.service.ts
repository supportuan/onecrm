import { prisma } from '../../prisma.js';
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_TENANT_MODULES,
  SYSTEM_ROLES,
} from './rbac.constants.js';
import { isForbiddenRoleName, slugifyRoleName } from '../../utils/role-permissions.js';
import { setTenantModules } from './tenant-modules.service.js';

/**
 * Per-tenant in-memory cache: tenantId -> (role -> permissions).
 * SUPER_ADMIN doesn't belong to any tenant; we synthesize an all-permissions
 * answer for them directly in hasPermission().
 *
 * Cache invalidation:
 *   - updateRolePermissions/resetToDefaults reload the affected tenant.
 *   - The super-admin module also calls invalidateTenant after seeding.
 */
const cache = new Map<number, Record<string, string[]>>();

const sanitize = (perms: string[]): string[] =>
  Array.from(new Set(perms.filter((p) => ALL_PERMISSIONS.includes(p))));

const allPermissionsFor = (): Record<string, string[]> => {
  const map: Record<string, string[]> = {};
  for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    map[role] = perms;
  }
  return map;
};

/** Seed the default role rows for a tenant. Called from createTenant.
 *  Existing rows with a non-empty permissions array are preserved (admin may
 *  have customized them); rows that are empty get refilled with defaults so
 *  a stale or partially-migrated row doesn't lock users out forever. */
export const seedTenantDefaults = async (tenantId: number): Promise<void> => {
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const existing = await prisma.rolePermission.findUnique({
      where: { tenantId_role: { tenantId, role } },
    });
    if (!existing) {
      await prisma.rolePermission.create({ data: { tenantId, role, permissions } });
    } else if (!existing.permissions || existing.permissions.length === 0) {
      await prisma.rolePermission.update({
        where: { tenantId_role: { tenantId, role } },
        data: { permissions },
      });
    }
  }
  cache.delete(tenantId);
};

/** Load and cache the role->perms map for one tenant. */
export const loadPermissions = async (
  tenantId: number,
): Promise<Record<string, string[]>> => {
  const rows = await prisma.rolePermission.findMany({ where: { tenantId } });
  const map: Record<string, string[]> = {};
  for (const row of rows) map[row.role] = row.permissions;

  // Fallback: roles missing OR with an empty permissions array inherit the
  // static defaults. The "empty array" branch catches stale rows from the
  // ADMIN -> GLOBAL_ADMIN rename or partial seeds.
  for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    if (!map[role] || map[role].length === 0) map[role] = perms;
  }

  cache.set(tenantId, map);
  return map;
};

export const getPermissionsMap = async (
  tenantId: number,
): Promise<Record<string, string[]>> => {
  return cache.get(tenantId) ?? (await loadPermissions(tenantId));
};

export const getPermissionsForRole = async (
  role: string,
  tenantId: number,
): Promise<string[]> => {
  const map = await getPermissionsMap(tenantId);
  return map[role] ?? [];
};

/**
 * SUPER_ADMIN: gets every permission, no tenant lookup (cross-tenant).
 * GLOBAL_ADMIN: tenant administrator — full access inside its own tenant.
 *   (Still subject to per-tenant module gating in requirePermission.)
 * Anyone else: looked up against the per-tenant cache.
 */
export const hasPermission = async (
  role: string,
  required: string[],
  tenantId: number | null,
): Promise<boolean> => {
  if (role === 'SUPER_ADMIN') return true;
  if (tenantId == null) return false;
  if (role === 'GLOBAL_ADMIN') return true;
  const perms = await getPermissionsForRole(role, tenantId);
  return required.some((p) => perms.includes(p));
};

export const updateRolePermissions = async (
  tenantId: number,
  role: string,
  permissions: string[],
): Promise<string[]> => {
  const clean = sanitize(permissions);
  await prisma.rolePermission.upsert({
    where: { tenantId_role: { tenantId, role } },
    update: { permissions: clean },
    create: { tenantId, role, permissions: clean },
  });
  await loadPermissions(tenantId);
  return clean;
};

export const createCustomRole = async (
  tenantId: number,
  name: string,
  permissions: string[] = [],
): Promise<{ role: string; label: string; permissions: string[] }> => {
  const label = name.trim();
  if (label.length < 2) {
    throw new Error('Role name must be at least 2 characters');
  }
  if (isForbiddenRoleName(label)) {
    throw new Error('That role name is reserved');
  }

  const role = slugifyRoleName(label);
  if (SYSTEM_ROLES.has(role)) {
    throw new Error('A system role with this name already exists');
  }

  const existing = await prisma.rolePermission.findUnique({
    where: { tenantId_role: { tenantId, role } },
  });
  if (existing) {
    throw new Error('A role with this name already exists');
  }

  const clean = sanitize(permissions);
  await prisma.rolePermission.create({
    data: { tenantId, role, permissions: clean },
  });
  await loadPermissions(tenantId);
  return { role, label, permissions: clean };
};

export const deleteCustomRole = async (
  tenantId: number,
  role: string,
  options: { reassignTo?: string } = {},
): Promise<{ reassigned: number; reassignTo: string | null }> => {
  const key = slugifyRoleName(role);
  if (SYSTEM_ROLES.has(key)) {
    throw new Error('System roles cannot be deleted');
  }

  const row = await prisma.rolePermission.findUnique({
    where: { tenantId_role: { tenantId, role: key } },
  });
  if (!row) {
    throw new Error('Role not found');
  }

  const assigned = await prisma.user.count({
    where: {
      tenantId,
      permissionRole: key,
    },
  });

  let reassignTo: string | null = null;
  let reassigned = 0;

  if (assigned > 0) {
    const targetRaw = options.reassignTo?.trim() || 'COUNSELLOR';
    const target = slugifyRoleName(targetRaw);
    if (target === key) {
      throw new Error('Choose a different role to reassign members to');
    }

    const targetExists =
      SYSTEM_ROLES.has(target) ||
      !!(await prisma.rolePermission.findUnique({
        where: { tenantId_role: { tenantId, role: target } },
      }));
    if (!targetExists) {
      throw new Error(`Reassign target role “${target}” was not found`);
    }

    const isSystemTarget = SYSTEM_ROLES.has(target);
    if (target === 'SUPER_ADMIN') {
      throw new Error('Cannot reassign members to Super Admin');
    }
    // For custom targets, keep a safe system enum (COUNSELLOR) underneath.
    const systemRole = isSystemTarget ? target : 'COUNSELLOR';
    const result = await prisma.user.updateMany({
      where: { tenantId, permissionRole: key },
      data: isSystemTarget
        ? {
            role: systemRole as any,
            roleLabel: null,
            permissionRole: null,
          }
        : {
            role: 'COUNSELLOR' as any,
            roleLabel: target.replace(/_/g, ' '),
            permissionRole: target,
          },
    });
    reassigned = result.count;
    reassignTo = target;
  }

  await prisma.rolePermission.delete({
    where: { tenantId_role: { tenantId, role: key } },
  });
  await loadPermissions(tenantId);
  return { reassigned, reassignTo };
};

export const resetToDefaults = async (
  tenantId: number,
): Promise<Record<string, string[]>> => {
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    await prisma.rolePermission.upsert({
      where: { tenantId_role: { tenantId, role } },
      update: { permissions },
      create: { tenantId, role, permissions },
    });
  }
  return loadPermissions(tenantId);
};

export const invalidateTenant = (tenantId: number): void => {
  cache.delete(tenantId);
};

// Boot-time hook: backfill defaults on every tenant so stale or partially
// migrated rows are healed. seedTenantDefaults preserves customized non-empty
// rows; only empty/missing rows are filled.
// export const ensureDefaultTenantSeeded = async (): Promise<void> => {
//   const tenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
//   if (tenant) await seedTenantDefaults(tenant.id);
// };

export const ensureDefaultTenantSeeded = async (): Promise<void> => {
  // Guarantee a "default" tenant exists. Every non-super-admin user must belong
  // to an ACTIVE tenant (see auth.service login gate) and getDefaultTenantId()
  // resolves by slug 'default'. Without this, a fresh database leaves all
  // staff/student logins broken with "User is not associated with any tenant".
  let defaultTenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
  if (!defaultTenant) {
    defaultTenant = await prisma.tenant.create({
      data: { name: 'Default Organization', slug: 'default', status: 'ACTIVE' },
    });
    // Enable the baseline modules so the default tenant lands on a usable UI and
    // the HR seed backfill (which keys off enabled modules) can run for it.
    await setTenantModules(defaultTenant.id, DEFAULT_TENANT_MODULES);
    console.log('[rbac] created default tenant');
  }

  // Heal RBAC role rows for every tenant (idempotent — preserves customized rows).
  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  for (const t of tenants) {
    try {
      await seedTenantDefaults(t.id);
    } catch (err) {
      console.error(`[rbac] failed to seed defaults for tenant ${t.id}`, err);
    }
  }
};

// Static fallback used when no tenant context exists (scripts, etc.)
export const STATIC_DEFAULTS = allPermissionsFor();
