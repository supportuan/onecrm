import { prisma } from '../../prisma.js';
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from './rbac.constants.js';

/**
 * In-memory cache of role -> permissions. Loaded from the database and
 * refreshed whenever permissions are updated, so changes take effect live
 * without a server restart.
 */
let permissionCache: Record<string, string[]> | null = null;

const sanitize = (perms: string[]): string[] =>
  Array.from(new Set(perms.filter((p) => ALL_PERMISSIONS.includes(p))));

/** Ensure every default role exists in the DB (idempotent). */
export const ensureDefaults = async (): Promise<void> => {
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const existing = await prisma.rolePermission.findUnique({ where: { role } });
    if (!existing) {
      await prisma.rolePermission.create({ data: { role, permissions } });
    }
  }
};

/** Load the full role -> permissions map from DB into the cache. */
export const loadPermissions = async (): Promise<Record<string, string[]>> => {
  const rows = await prisma.rolePermission.findMany();
  const map: Record<string, string[]> = {};

  for (const row of rows) {
    map[row.role] = row.permissions;
  }

  // Fallback for any role missing in DB but present in defaults.
  for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    if (!map[role]) map[role] = perms;
  }

  permissionCache = map;
  return map;
};

export const getPermissionsMap = async (): Promise<Record<string, string[]>> => {
  if (!permissionCache) {
    await loadPermissions();
  }
  return permissionCache ?? {};
};

export const getPermissionsForRole = async (role: string): Promise<string[]> => {
  const map = await getPermissionsMap();
  return map[role] ?? [];
};

export const hasPermission = async (role: string, required: string[]): Promise<boolean> => {
  const perms = await getPermissionsForRole(role);
  return required.some((p) => perms.includes(p));
};

export const updateRolePermissions = async (
  role: string,
  permissions: string[]
): Promise<string[]> => {
  const clean = sanitize(permissions);
  await prisma.rolePermission.upsert({
    where: { role },
    update: { permissions: clean },
    create: { role, permissions: clean },
  });
  await loadPermissions();
  return clean;
};

export const resetToDefaults = async (): Promise<Record<string, string[]>> => {
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    await prisma.rolePermission.upsert({
      where: { role },
      update: { permissions },
      create: { role, permissions },
    });
  }
  return loadPermissions();
};
