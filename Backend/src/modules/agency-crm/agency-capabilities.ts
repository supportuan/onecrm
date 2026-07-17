/**
 * Explicit partner capabilities (fine-grained).
 * Coarse gate remains VIEW_AGENCY_CRM; these refine what an active partner may do.
 * Admins assign/override via partner update; defaults apply on provision.
 */
export type AgencyCapabilities = {
  canEditOwnProfile: boolean;
  canUploadDocuments: boolean;
  canManageApplications: boolean;
  canViewCommission: boolean;
  canEditCommissionRules: boolean;
  canPayFees: boolean;
  canMessageUniversity: boolean;
  countries: string[];
  universities: string[];
  featureFlags: Record<string, boolean>;
};

export const DEFAULT_AGENT_CAPABILITIES: AgencyCapabilities = {
  canEditOwnProfile: true,
  canUploadDocuments: true,
  canManageApplications: true,
  canViewCommission: true,
  canEditCommissionRules: false,
  canPayFees: false,
  canMessageUniversity: false,
  countries: [],
  universities: [],
  featureFlags: {},
};

export const mergeCapabilities = (
  raw?: unknown
): AgencyCapabilities => {
  const incoming =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Partial<AgencyCapabilities>)
      : {};

  return {
    ...DEFAULT_AGENT_CAPABILITIES,
    ...incoming,
    countries: Array.isArray(incoming.countries)
      ? incoming.countries.map(String)
      : DEFAULT_AGENT_CAPABILITIES.countries,
    universities: Array.isArray(incoming.universities)
      ? incoming.universities.map(String)
      : DEFAULT_AGENT_CAPABILITIES.universities,
    featureFlags:
      incoming.featureFlags && typeof incoming.featureFlags === 'object'
        ? { ...DEFAULT_AGENT_CAPABILITIES.featureFlags, ...incoming.featureFlags }
        : { ...DEFAULT_AGENT_CAPABILITIES.featureFlags },
  };
};

export const hasCapability = (
  raw: unknown,
  key: keyof AgencyCapabilities
): boolean => {
  const caps = mergeCapabilities(raw);
  const value = caps[key];
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
};
