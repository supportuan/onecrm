import { prisma } from '../../prisma.js';
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from './rbac.constants.js';

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
  // console.log("Prisma Models:", Object.keys(prisma));

  const tenants = await prisma.tenant.findMany({
    select: { id: true }
  });

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
