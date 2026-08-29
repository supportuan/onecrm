import { prisma } from '../../prisma.js';
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  SYSTEM_ROLES,
} from './rbac.constants.js';
import {
  hasConfiguredModuleAccess,
  isForbiddenRoleName,
  moduleAccessToPermissions,
  slugifyRoleName,
} from '../../utils/role-permissions.js';

let cache: Record<string, string[]> | null = null;

const sanitize = (perms: string[]): string[] =>
  Array.from(new Set(perms.filter((p) => ALL_PERMISSIONS.includes(p))));

const allPermissionsFor = (): Record<string, string[]> => {
  const map: Record<string, string[]> = {};
  for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    map[role] = perms;
  }
  return map;
};

const roleWhere = (role: string) => ({ role });

export const seedRoleDefaults = async (): Promise<void> => {
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const existing = await prisma.rolePermission.findUnique({
      where: roleWhere(role),
    });
    if (!existing) {
      await prisma.rolePermission.create({ data: { role, permissions } });
    } else if (!existing.permissions || existing.permissions.length === 0) {
      await prisma.rolePermission.update({
        where: roleWhere(role),
        data: { permissions },
      });
    } else {
      const trainingPerms = permissions.filter(
        (p) => (p === 'VIEW_TRAINING' || p === 'MANAGE_TRAINING') && !existing.permissions.includes(p),
      );
      if (trainingPerms.length > 0) {
        await prisma.rolePermission.update({
          where: roleWhere(role),
          data: { permissions: [...existing.permissions, ...trainingPerms] },
        });
      }
    }
  }
  cache = null;
};

export const loadPermissions = async (): Promise<Record<string, string[]>> => {
  const rows = await prisma.rolePermission.findMany();
  const map: Record<string, string[]> = {};
  for (const row of rows) map[row.role] = row.permissions;

  for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    if (!map[role] || map[role].length === 0) map[role] = perms;
  }

  cache = map;
  return map;
};

export const getPermissionsMap = async (): Promise<Record<string, string[]>> => {
  return cache ?? (await loadPermissions());
};

export const getPermissionsForRole = async (role: string): Promise<string[]> => {
  const map = await getPermissionsMap();
  return map[role] ?? [];
};

export const hasPermission = async (
  role: string,
  required: string[],
): Promise<boolean> => {
  if (role === 'SUPER_ADMIN' || role === 'GLOBAL_ADMIN') return true;
  const perms = await getPermissionsForRole(role);
  return required.some((p) => perms.includes(p));
};

export const resolveEffectivePermissions = async (user: {
  role: string;
  permissionRole?: string | null;
  moduleAccess?: Record<string, Record<string, string[]>> | null;
}): Promise<string[]> => {
  const role = user.permissionRole ?? user.role;
  if (hasConfiguredModuleAccess(user.moduleAccess)) {
    return moduleAccessToPermissions(user.moduleAccess);
  }
  if (role === 'SUPER_ADMIN' || role === 'GLOBAL_ADMIN') {
    return [...ALL_PERMISSIONS];
  }
  return getPermissionsForRole(role);
};

export const hasUserPermission = async (
  user: {
    role: string;
    permissionRole?: string | null;
    moduleAccess?: Record<string, Record<string, string[]>> | null;
  },
  required: string[],
): Promise<boolean> => {
  const effective = await resolveEffectivePermissions(user);
  return required.some((p) => effective.includes(p));
};

export const updateRolePermissions = async (
  role: string,
  permissions: string[],
): Promise<string[]> => {
  const clean = sanitize(permissions);
  await prisma.rolePermission.upsert({
    where: roleWhere(role),
    update: { permissions: clean },
    create: { role, permissions: clean },
  });
  await loadPermissions();
  return clean;
};

export const createCustomRole = async (
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
    where: roleWhere(role),
  });
  if (existing) {
    throw new Error('A role with this name already exists');
  }

  const clean = sanitize(permissions);
  await prisma.rolePermission.create({
    data: { role, permissions: clean },
  });
  await loadPermissions();
  return { role, label, permissions: clean };
};

export const deleteCustomRole = async (
  role: string,
  options: { reassignTo?: string } = {},
): Promise<{ reassigned: number; reassignTo: string | null }> => {
  const key = slugifyRoleName(role);
  if (SYSTEM_ROLES.has(key)) {
    throw new Error('System roles cannot be deleted');
  }

  const row = await prisma.rolePermission.findUnique({
    where: roleWhere(key),
  });
  if (!row) {
    throw new Error('Role not found');
  }

  const assigned = await prisma.user.count({
    where: { permissionRole: key },
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
        where: roleWhere(target),
      }));
    if (!targetExists) {
      throw new Error(`Reassign target role “${target}” was not found`);
    }

    const isSystemTarget = SYSTEM_ROLES.has(target);
    if (target === 'SUPER_ADMIN') {
      throw new Error('Cannot reassign members to Super Admin');
    }
    const systemRole = isSystemTarget ? target : 'COUNSELLOR';
    const result = await prisma.user.updateMany({
      where: { permissionRole: key },
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
    where: roleWhere(key),
  });
  await loadPermissions();
  return { reassigned, reassignTo };
};

export const resetToDefaults = async (): Promise<Record<string, string[]>> => {
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    await prisma.rolePermission.upsert({
      where: roleWhere(role),
      update: { permissions },
      create: { role, permissions },
    });
  }
  return loadPermissions();
};

export const invalidateCache = (): void => {
  cache = null;
};

/** Boot-time hook: fill missing / empty default role rows. */
export const ensureDefaultTenantSeeded = async (): Promise<void> => {
  const { ensureOrgSettings } = await import('../../utils/org-settings.js');
  await ensureOrgSettings();
  await seedRoleDefaults();
};

export const STATIC_DEFAULTS = allPermissionsFor();
