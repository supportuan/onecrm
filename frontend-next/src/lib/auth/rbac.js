// ---------------------------------------------------------------------------
// RBAC catalog + defaults (frontend).
//
// The live source of truth is the backend (GET /api/rbac/permissions), loaded
// into PermissionsContext. The values below are the fallback defaults used
// before the live map loads and to render the Roles & Permissions editor.
// ---------------------------------------------------------------------------

// Permission catalog grouped by module — drives the Roles & Permissions UI.
export const PERMISSION_CATEGORIES = [
  {
    title: 'Marketing',
    key: 'marketing',
    permissions: [
      { key: 'VIEW_MARKETING', name: 'view marketing', desc: 'access the marketing module, leads, campaigns and analytics.' },
      { key: 'MANAGE_MARKETING', name: 'manage marketing', desc: 'create/edit leads, campaigns, automations and landing pages.' },
    ],
  },
  {
    title: 'Student CRM',
    key: 'student_crm',
    permissions: [
      { key: 'VIEW_STUDENT_CRM', name: 'view student crm', desc: 'access student management, applications, counselling, visas.' },
      { key: 'MANAGE_STUDENT_CRM', name: 'manage student crm', desc: 'create/edit students, applications and counselling records.' },
    ],
  },
  {
    title: 'Agency CRM',
    key: 'agency_crm',
    permissions: [
      { key: 'VIEW_AGENCY_CRM', name: 'view agency crm', desc: 'access agency management, leads, commissions and co-branding.' },
      { key: 'MANAGE_AGENCY_CRM', name: 'manage agency crm', desc: 'create/edit agencies, commissions and co-branding tools.' },
    ],
  },
  {
    title: 'HR — module access',
    key: 'hr_module',
    permissions: [
      { key: 'VIEW_HR', name: 'view hr module', desc: 'access the hrms module from the sidebar.' },
    ],
  },
  {
    title: 'HR — employee directory & org',
    key: 'hr_directory',
    permissions: [
      { key: 'VIEW_ALL_EMPLOYEES', name: 'view all employees', desc: 'see the full personnel directory.' },
      { key: 'MANAGE_EMPLOYEES', name: 'manage employees', desc: 'create, modify, and archive employee records.' },
      { key: 'VIEW_TEAM', name: 'view team members', desc: 'see the assigned reporting tree.' },
      { key: 'MANAGE_TEAM', name: 'manage team org', desc: 'reorganize teams and supervisor relationships.' },
    ],
  },
  {
    title: 'HR — finance & payroll',
    key: 'hr_payroll',
    permissions: [
      { key: 'MANAGE_PAYROLL', name: 'manage payroll', desc: 'run payroll batches and edit salary structures.' },
      { key: 'VIEW_OWN_PAYSLIP', name: 'view own payslip', desc: 'download personal monthly payslip.' },
      { key: 'VIEW_REPORTS', name: 'view financial reports', desc: 'audit ledger distributions and finance analytics.' },
    ],
  },
  {
    title: 'HR — biometric & attendance',
    key: 'hr_attendance',
    permissions: [
      { key: 'MANAGE_BIOMETRICS', name: 'manage biometrics', desc: 'register hardware and manage enrolled users.' },
      { key: 'MANAGE_NETWORK_SECURITY', name: 'manage network whitelist', desc: 'configure ip ranges and geofences.' },
      { key: 'VIEW_ATTENDANCE', name: 'view attendance', desc: 'view daily clocks, calendars, and logs.' },
      { key: 'MANAGE_ATTENDANCE', name: 'manage attendance', desc: 'approve or reject regularization requests.' },
    ],
  },
  {
    title: 'HR — leave & system',
    key: 'hr_system',
    permissions: [
      { key: 'VIEW_LEAVE', name: 'view leave balances', desc: 'view leave requests and balances.' },
      { key: 'MANAGE_LEAVE', name: 'manage leave policies', desc: 'configure entitlement plans and approve leaves.' },
      { key: 'MANAGE_SCHEDULING', name: 'manage scheduling', desc: 'configure shift and roster scheduling rules.' },
      { key: 'MANAGE_SUPPORT_REQUESTS', name: 'manage support requests', desc: 'triage and resolve internal support tickets.' },
    ],
  },
  {
    title: 'Administration',
    key: 'admin',
    permissions: [
      { key: 'VIEW_ADMIN', name: 'view admin settings', desc: 'access the admin & settings module.' },
      { key: 'MANAGE_SYSTEM', name: 'manage system', desc: 'root configuration: branding, cycles, holidays.' },
      { key: 'MANAGE_ADMINS', name: 'manage roles & admins', desc: 'edit roles & permissions and administrator accounts.' },
    ],
  },
];

export const ALL_PERMISSIONS = PERMISSION_CATEGORIES.flatMap((c) =>
  c.permissions.map((p) => p.key)
);

export const ROLE_DESCRIPTIONS = {
  SUPER_ADMIN: 'platform owner. cross-tenant access — onboards tenants and toggles their modules.',
  GLOBAL_ADMIN: 'tenant administrator. full access inside their own tenant; cannot see other tenants.',
  HR: 'hr operators. full hr module access except admin-level system config.',
  MARKETING_MANAGER: 'marketing manager. owns leads, campaigns, automations and landing pages.',
  COUNSELLOR: 'counsellor / advisor. marketing + student crm management, self-service hr.',
  TELECALLER: 'telecaller. view-only on marketing and student crm; self-service hr.',
  AGENCY_FREELANCER: 'agency partner / freelancer. agency crm + student crm visibility.',
  STUDENT: 'student. student crm only.',
};

/** Roles hidden from the Admin > Roles & Permissions editor UI. */
export const HIDDEN_ROLES = new Set(['STUDENT']);

// Maps a top-level module (by sidebar label) to the permission(s) that grant it.
export const MODULE_PERMISSION_MAP = {
  Marketing: ['VIEW_MARKETING', 'MANAGE_MARKETING'],
  'Student CRM': ['VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'],
  'Agency CRM': ['VIEW_AGENCY_CRM', 'MANAGE_AGENCY_CRM'],
  HR: ['VIEW_HR'],
  HRMS: ['VIEW_HR'],
  'Admin Settings': ['VIEW_ADMIN', 'MANAGE_SYSTEM', 'MANAGE_ADMINS'],
  'Admin & Settings': ['VIEW_ADMIN', 'MANAGE_SYSTEM', 'MANAGE_ADMINS'],
};

// Maps a sidebar label to its tenant-module key. Super admin toggles these
// per tenant; if the tenant has the module disabled, the item is hidden.
// Items without an entry here are not tenant-gated.
export const MODULE_KEY_MAP = {
  Marketing: 'MARKETING',
  'Student CRM': 'STUDENT_CRM',
  'Agency CRM': 'AGENCY_CRM',
  HR: 'HR',
  HRMS: 'HR',
  'Admin Settings': 'ADMIN',
  'Admin & Settings': 'ADMIN',
};

// Fallback defaults — mirror Backend/src/modules/rbac/rbac.constants.ts
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [...ALL_PERMISSIONS],
  GLOBAL_ADMIN: [...ALL_PERMISSIONS],
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
  STUDENT: ['VIEW_STUDENT_CRM'],
};

const normalizeRole = (role) => (role || '').toUpperCase().replace(/[-\s]/g, '_');

/**
 * Check a single permission for a role.
 * `permissionMap` (the live map from PermissionsContext) takes precedence;
 * falls back to the static ROLE_PERMISSIONS defaults.
 */
export function hasPermission(role, permission, permissionMap) {
  if (!role || !permission) return false;
  const normalizedRole = normalizeRole(role);
  // SUPER_ADMIN (platform) and GLOBAL_ADMIN (tenant administrator) have full
  // access; never gate them behind individual permission strings.
  if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'GLOBAL_ADMIN') return true;
  const source = permissionMap && permissionMap[normalizedRole]
    ? permissionMap[normalizedRole]
    : ROLE_PERMISSIONS[normalizedRole] || [];
  return source.includes(permission);
}

export function hasAnyPermission(role, requirement, permissionMap) {
  const required = Array.isArray(requirement) ? requirement : [requirement];
  return required.some((permission) => hasPermission(role, permission, permissionMap));
}

export const ROUTE_PERMISSIONS = [
  { pathPattern: /^\/api\/employees\/me/i, permission: 'VIEW_OWN_PAYSLIP' },
  { pathPattern: /^\/api\/employees\/[^/]+\/access-role$/i, permission: ['MANAGE_EMPLOYEES', 'MANAGE_SYSTEM'] },
  { pathPattern: /^\/api\/employees/i, permission: ['VIEW_ALL_EMPLOYEES', 'VIEW_TEAM', 'VIEW_ATTENDANCE', 'VIEW_LEAVE'] },
  { pathPattern: /^\/api\/payroll\/admin/i, permission: 'MANAGE_PAYROLL' },
  { pathPattern: /^\/api\/reports/i, permission: 'VIEW_REPORTS' },
];

export function getRequiredPermissionForPath(pathname) {
  for (const mapping of ROUTE_PERMISSIONS) {
    if (mapping.pathPattern.test(pathname)) {
      return mapping.permission;
    }
  }
  return null;
}
