import { prisma } from '../../prisma.js';
import {
  DEFAULT_TENANT_MODULES,
  MODULE_CATALOG,
  ModuleKey,
} from './rbac.constants.js';

// tenantId -> Set of enabled module keys. Loaded lazily, invalidated on write.
const cache = new Map<number, Set<ModuleKey>>();

export const loadTenantModules = async (tenantId: number): Promise<Set<ModuleKey>> => {
  const rows = await prisma.tenantModule.findMany({
    where: { tenantId, enabled: true },
    select: { moduleKey: true },
  });
  const set = new Set<ModuleKey>(rows.map((r) => r.moduleKey as ModuleKey));
  cache.set(tenantId, set);
  return set;
};

export const getEnabledModules = async (tenantId: number): Promise<Set<ModuleKey>> => {
  return cache.get(tenantId) ?? (await loadTenantModules(tenantId));
};

export const isModuleEnabled = async (
  tenantId: number,
  moduleKey: ModuleKey,
): Promise<boolean> => {
  const enabled = await getEnabledModules(tenantId);
  return enabled.has(moduleKey);
};

export const invalidateTenantCache = (tenantId: number): void => {
  cache.delete(tenantId);
};

// Used by super-admin onboarding to set the initial module list.
export const setTenantModules = async (
  tenantId: number,
  enabledKeys: ModuleKey[],
): Promise<void> => {
  const validKeys = new Set(MODULE_CATALOG.map((m) => m.key));
  const writes = MODULE_CATALOG.map((mod) =>
    prisma.tenantModule.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey: mod.key } },
      create: {
        tenantId,
        moduleKey: mod.key,
        enabled: enabledKeys.includes(mod.key) && validKeys.has(mod.key),
      },
      update: { enabled: enabledKeys.includes(mod.key) && validKeys.has(mod.key) },
    }),
  );
  await prisma.$transaction(writes);
  invalidateTenantCache(tenantId);
};

export const seedDefaultTenantModules = async (tenantId: number): Promise<void> => {
  await setTenantModules(tenantId, DEFAULT_TENANT_MODULES);
};
