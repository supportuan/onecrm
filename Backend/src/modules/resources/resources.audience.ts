import { UserRole } from '@prisma/client';

export type ResourceAudienceKey = 'ALL' | 'STUDENT' | 'AGENT' | 'STAFF';

export const RESOURCE_AUDIENCE_OPTIONS: { key: ResourceAudienceKey; label: string }[] = [
  { key: 'ALL', label: 'All users' },
  { key: 'STUDENT', label: 'Students' },
  { key: 'AGENT', label: 'Agents & freelancers' },
  { key: 'STAFF', label: 'Staff (HR, counsellors, admins)' },
];

const STAFF_ROLES = new Set<UserRole>([
  UserRole.SUPER_ADMIN,
  UserRole.GLOBAL_ADMIN,
  UserRole.HR,
  UserRole.COUNSELLOR,
  UserRole.MARKETING_MANAGER,
  UserRole.TELECALLER,
]);

const AGENT_ROLES = new Set<UserRole>([UserRole.AGENT, UserRole.AGENCY_FREELANCER]);

export const normalizeTargetRoles = (raw: unknown): ResourceAudienceKey[] => {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<ResourceAudienceKey>(['ALL', 'STUDENT', 'AGENT', 'STAFF']);
  const roles = raw
    .map((v) => String(v).toUpperCase() as ResourceAudienceKey)
    .filter((v) => allowed.has(v));
  return roles;
};

export const roleMatchesAudience = (role: UserRole, targetRoles: unknown): boolean => {
  const targets = normalizeTargetRoles(targetRoles);
  if (targets.includes('ALL')) return true;
  if (targets.includes('STUDENT') && role === UserRole.STUDENT) return true;
  if (targets.includes('AGENT') && AGENT_ROLES.has(role)) return true;
  if (targets.includes('STAFF') && STAFF_ROLES.has(role)) return true;
  return false;
};
