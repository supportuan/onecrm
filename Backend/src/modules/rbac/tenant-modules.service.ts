import { MODULE_CATALOG, ModuleKey } from './rbac.constants.js';

const ALL_KEYS = MODULE_CATALOG.map((m) => m.key);
const VALID = new Set<string>(ALL_KEYS);

const parseEnabledModules = (raw: string): ModuleKey[] => {
  const wanted = raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .filter((k) => VALID.has(k)) as ModuleKey[];
  return wanted.length > 0 ? wanted : ALL_KEYS;
};

/** Full catalog unless ENABLED_MODULES lists a subset for this install. */
export const getEnabledModules = async (): Promise<Set<ModuleKey>> => {
  const raw = (process.env.ENABLED_MODULES || '').trim();
  if (!raw) return new Set(ALL_KEYS);
  return new Set(parseEnabledModules(raw));
};

export const isModuleEnabled = async (moduleKey: ModuleKey): Promise<boolean> => {
  const enabled = await getEnabledModules();
  return enabled.has(moduleKey);
};

export const loadTenantModules = async (): Promise<Set<ModuleKey>> => getEnabledModules();

export const setTenantModules = async (): Promise<void> => {
  /* no-op: this install is a single org; use ENABLED_MODULES in env */
};

export const seedDefaultTenantModules = async (): Promise<void> => {
  /* no-op */
};

export const invalidateTenantCache = (): void => {
  /* no-op */
};
