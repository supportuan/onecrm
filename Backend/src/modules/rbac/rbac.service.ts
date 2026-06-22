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

/** Seed the default role rows for a tenant. Called from createTenant. */
export const seedTenantDefaults = async (tenantId: number): Promise<void> => {
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    await prisma.rolePermission.upsert({
      where: { tenantId_role: { tenantId, role } },
      create: { tenantId, role, permissions },
      update: {},
    });
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

  // Fallback: roles missing from the DB inherit the static defaults so a
  // newly added role (in code) doesn't 403 every user until reseeded.
  for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    if (!map[role]) map[role] = perms;
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
 * SUPER_ADMIN: gets every permission, no tenant lookup.
 * Anyone else: looked up against the per-tenant cache.
 */
export const hasPermission = async (
  role: string,
  required: string[],
  tenantId: number | null,
): Promise<boolean> => {
  if (role === 'SUPER_ADMIN') return true;
  if (tenantId == null) return false;
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

// Boot-time hook: backfill defaults on the default tenant so the existing
// app keeps working without manual seed steps.
export const ensureDefaultTenantSeeded = async (): Promise<void> => {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
  if (tenant) await seedTenantDefaults(tenant.id);
};

// Static fallback used when no tenant context exists (scripts, etc.)
export const STATIC_DEFAULTS = allPermissionsFor();
