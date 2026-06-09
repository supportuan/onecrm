// ---------------------------------------------------------------------------
// Canonical permission catalog + default role -> permission mapping.
// This seeds the database. Once seeded, the DB is the live source of truth
// and can be edited from Admin Settings > Roles & Permissions.
// ---------------------------------------------------------------------------

// Module-level access (controls sidebar + module route access)
export const MODULE_PERMISSIONS = [
  'VIEW_MARKETING',
  'MANAGE_MARKETING',
  'VIEW_STUDENT_CRM',
  'MANAGE_STUDENT_CRM',
  'VIEW_AGENCY_CRM',
  'MANAGE_AGENCY_CRM',
  'VIEW_HR',
  'VIEW_ADMIN',
] as const;

// Granular HR permissions (existing, kept so HR routes keep working)
export const HR_PERMISSIONS = [
  'VIEW_ALL_EMPLOYEES',
  'MANAGE_EMPLOYEES',
  'MANAGE_PAYROLL',
  'VIEW_OWN_PAYSLIP',
  'MANAGE_BIOMETRICS',
  'MANAGE_NETWORK_SECURITY',
  'MANAGE_SCHEDULING',
  'VIEW_TEAM',
  'MANAGE_TEAM',
  'VIEW_ATTENDANCE',
  'MANAGE_ATTENDANCE',
  'VIEW_LEAVE',
  'MANAGE_LEAVE',
  'MANAGE_ADMINS',
  'MANAGE_SUPPORT_REQUESTS',
  'MANAGE_SYSTEM',
  'VIEW_REPORTS',
] as const;

export const ALL_PERMISSIONS: string[] = [
  ...MODULE_PERMISSIONS,
  ...HR_PERMISSIONS,
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [...ALL_PERMISSIONS],
  ADMIN: [
    'VIEW_MARKETING', 'MANAGE_MARKETING',
    'VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM',
    'VIEW_AGENCY_CRM', 'MANAGE_AGENCY_CRM',
    'VIEW_HR', 'VIEW_ADMIN',
    'VIEW_ALL_EMPLOYEES', 'MANAGE_EMPLOYEES', 'MANAGE_PAYROLL', 'VIEW_OWN_PAYSLIP',
    'MANAGE_BIOMETRICS', 'VIEW_TEAM', 'MANAGE_TEAM', 'VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE',
    'VIEW_LEAVE', 'MANAGE_LEAVE', 'MANAGE_SUPPORT_REQUESTS', 'MANAGE_SYSTEM', 'VIEW_REPORTS',
  ],
  HR: [
    'VIEW_HR',
    'VIEW_ALL_EMPLOYEES', 'MANAGE_EMPLOYEES', 'MANAGE_PAYROLL', 'VIEW_OWN_PAYSLIP',
    'VIEW_TEAM', 'MANAGE_TEAM', 'VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE', 'VIEW_LEAVE', 'MANAGE_LEAVE',
    'MANAGE_SUPPORT_REQUESTS', 'VIEW_REPORTS',
  ],
  COUNSELLOR: [
    'VIEW_MARKETING', 'VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM',
    'VIEW_HR', 'VIEW_OWN_PAYSLIP', 'VIEW_ATTENDANCE', 'VIEW_LEAVE',
  ],
  MARKETING_MANAGER: [
    'VIEW_MARKETING', 'MANAGE_MARKETING',
    'VIEW_HR', 'VIEW_OWN_PAYSLIP', 'VIEW_ATTENDANCE', 'VIEW_LEAVE', 'VIEW_REPORTS',
  ],
  TELECALLER: [
    'VIEW_MARKETING', 'VIEW_STUDENT_CRM',
    'VIEW_HR', 'VIEW_OWN_PAYSLIP', 'VIEW_ATTENDANCE', 'VIEW_LEAVE',
  ],
  AGENCY_FREELANCER: [
    'VIEW_AGENCY_CRM', 'MANAGE_AGENCY_CRM',
    'VIEW_STUDENT_CRM',
  ],
  STUDENT: [
    'VIEW_STUDENT_CRM',
  ],
};

/**
 * Roles that should be hidden from the Admin > Roles & Permissions editor UI.
 * They still exist and can be assigned via /admin-settings/users, but admins
 * don't need to manage their permissions interactively.
 */
export const HIDDEN_ROLES = new Set(['STUDENT']);
