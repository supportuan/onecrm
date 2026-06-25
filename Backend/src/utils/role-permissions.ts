import { UserRole } from '@prisma/client';

const RESERVED_SUPER = new Set(['SUPER_ADMIN', 'SUPERADMIN', 'SUPER ADMIN']);

/** Normalize a free-form role name into a stable RolePermission key. */
export const slugifyRoleName = (name: string): string => {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
  return slug || 'CUSTOM_ROLE';
};

export const isForbiddenRoleName = (name: string): boolean => {
  const slug = slugifyRoleName(name);
  return RESERVED_SUPER.has(slug) || slug.includes('SUPER_ADMIN');
};

/** Map sidebar moduleAccess JSON to RBAC permission strings. */
export const moduleAccessToPermissions = (
  moduleAccess: Record<string, Record<string, string[]>> | null | undefined,
): string[] => {
  if (!moduleAccess || typeof moduleAccess !== 'object') return [];

  const perms = new Set<string>();
  const hasEdit = (actions?: string[]) => Array.isArray(actions) && actions.includes('EDIT');
  const hasView = (actions?: string[]) => Array.isArray(actions) && actions.length > 0;

  const moduleOpts = (module: string) => moduleAccess[module] || {};

  const marketing = moduleOpts('Marketing');
  if (Object.values(marketing).some(hasView)) perms.add('VIEW_MARKETING');
  if (Object.values(marketing).some(hasEdit)) perms.add('MANAGE_MARKETING');

  const student = moduleOpts('Student CRM');
  if (Object.values(student).some(hasView)) perms.add('VIEW_STUDENT_CRM');
  if (Object.values(student).some(hasEdit)) perms.add('MANAGE_STUDENT_CRM');

  const agency = moduleOpts('Agency CRM');
  if (Object.values(agency).some(hasView)) perms.add('VIEW_AGENCY_CRM');
  if (Object.values(agency).some(hasEdit)) perms.add('MANAGE_AGENCY_CRM');

  const hr = moduleOpts('HR');
  const hrHasView = Object.values(hr).some(hasView);
  const hrHasEdit = Object.values(hr).some(hasEdit);
  if (hrHasView || hrHasEdit) {
    perms.add('VIEW_HR');
    perms.add('VIEW_OWN_PAYSLIP');
    perms.add('VIEW_ATTENDANCE');
    perms.add('VIEW_LEAVE');
  }
  if (hr['Employee Directory'] && hasEdit(hr['Employee Directory'])) {
    perms.add('VIEW_ALL_EMPLOYEES');
    perms.add('MANAGE_EMPLOYEES');
    perms.add('VIEW_TEAM');
    perms.add('MANAGE_TEAM');
  }
  if (hr['Recruitment Tracker'] && hasEdit(hr['Recruitment Tracker'])) {
    perms.add('VIEW_ALL_EMPLOYEES');
    perms.add('MANAGE_EMPLOYEES');
  }
  if (hr.Attendance && hasEdit(hr.Attendance)) perms.add('MANAGE_ATTENDANCE');
  if (hr['Leave Management'] && hasEdit(hr['Leave Management'])) perms.add('MANAGE_LEAVE');
  if (hr['Payroll Inputs'] && hasEdit(hr['Payroll Inputs'])) perms.add('MANAGE_PAYROLL');
  if (hr['Performance Reviews'] && hasView(hr['Performance Reviews'])) perms.add('VIEW_REPORTS');

  const admin = moduleOpts('Admin & Settings');
  if (Object.values(admin).some(hasView)) perms.add('VIEW_ADMIN');
  if (admin['User Management'] && hasEdit(admin['User Management'])) {
    perms.add('MANAGE_EMPLOYEES');
  }
  if ((admin.Roles && hasEdit(admin.Roles)) || (admin.Permissions && hasEdit(admin.Permissions))) {
    perms.add('MANAGE_ADMINS');
  }
  if (admin.Settings && hasEdit(admin.Settings)) perms.add('MANAGE_SYSTEM');

  return Array.from(perms);
};

export const inferSystemRole = (roleName: string): UserRole => {
  const slug = slugifyRoleName(roleName);
  if (slug === 'GLOBAL_ADMIN' || slug === 'ADMIN') return UserRole.GLOBAL_ADMIN;
  if (slug === 'HR' || slug.startsWith('HR_')) return UserRole.HR;
  if (slug === 'STUDENT') return UserRole.STUDENT;
  if (slug === 'AGENT' || slug.startsWith('AGENCY_')) return UserRole.AGENT;
  if (slug === 'COUNSELLOR') return UserRole.COUNSELLOR;
  if (slug === 'MARKETING_MANAGER') return UserRole.MARKETING_MANAGER;
  if (slug === 'TELECALLER') return UserRole.TELECALLER;
  return UserRole.COUNSELLOR;
};

export const employeeSelfServiceModuleAccess = () => ({
  HR: {
    Attendance: ['VIEW', 'EDIT'],
    'Leave Management': ['VIEW', 'EDIT'],
    'Payroll Inputs': ['VIEW'],
  },
});

export const employeeSelfServicePermissions = () =>
  moduleAccessToPermissions(employeeSelfServiceModuleAccess() as Record<string, Record<string, string[]>>);
