import { MODULE_CATALOG, ModuleKey } from './rbac.constants.js';

/** ApplyUniNow always has the full catalog enabled. */
export const getEnabledModules = async (): Promise<Set<ModuleKey>> =>
  new Set(MODULE_CATALOG.map((m) => m.key));

export const isModuleEnabled = async (moduleKey: ModuleKey): Promise<boolean> => {
  const enabled = await getEnabledModules();
  return enabled.has(moduleKey);
};

export const loadTenantModules = async (): Promise<Set<ModuleKey>> => getEnabledModules();

export const setTenantModules = async (): Promise<void> => {
  /* no-op: module catalog is always fully enabled */
};

export const seedDefaultTenantModules = async (): Promise<void> => {
  /* no-op */
};

export const invalidateTenantCache = (): void => {
  /* no-op */
};
