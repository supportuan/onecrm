import { ROLE_PERMISSIONS } from './rbac';

const normalizeRole = (role) => (role || '').toUpperCase().replace(/[-\s]/g, '_');
const fullAccessPermissions = () =>
  ROLE_PERMISSIONS.GLOBAL_ADMIN || ROLE_PERMISSIONS.SUPER_ADMIN || [];

export const HR_SELF_SERVICE_OPTIONS = [
  'Attendance',
  'Leave Management',
  'Payroll Inputs',
];

/** True when the user has an explicit per-module access matrix stored. */
export const hasConfiguredModuleAccess = (moduleAccess) => {
  if (!moduleAccess || typeof moduleAccess !== 'object') return false;
  return Object.values(moduleAccess).some((options) =>
    Object.values(options || {}).some(
      (actions) => Array.isArray(actions) && actions.length > 0,
    ),
  );
};

export const moduleHasAnyAccess = (moduleAccess, moduleName) => {
  const opts = moduleAccess?.[moduleName];
  if (!opts) return false;
  return Object.values(opts).some(
    (actions) => Array.isArray(actions) && actions.length > 0,
  );
};

export const hasHrSelfServiceAccess = (moduleAccess) => {
  const hr = moduleAccess?.HR || {};
  return HR_SELF_SERVICE_OPTIONS.some(
    (option) => Array.isArray(hr[option]) && hr[option].length > 0,
  );
};

/** Mirror Backend/src/utils/role-permissions.ts */
export const moduleAccessToPermissions = (moduleAccess) => {
  if (!moduleAccess || typeof moduleAccess !== 'object' || Array.isArray(moduleAccess)) return [];

  const perms = new Set();
  const hasEdit = (actions) => Array.isArray(actions) && actions.includes('EDIT');
  const hasView = (actions) => Array.isArray(actions) && actions.length > 0;
  const moduleOpts = (module) => moduleAccess[module] || {};

  const marketing = moduleOpts('Marketing');
  if (Object.values(marketing).some(hasView)) perms.add('VIEW_MARKETING');
  if (Object.values(marketing).some(hasEdit)) perms.add('MANAGE_MARKETING');

  const student = moduleOpts('Student CRM');
  if (Object.values(student).some(hasView)) perms.add('VIEW_STUDENT_CRM');
  if (Object.values(student).some(hasEdit)) perms.add('MANAGE_STUDENT_CRM');

  const agency = moduleOpts('Agency CRM');
  if (Object.values(agency).some(hasView)) perms.add('VIEW_AGENCY_CRM');
  if (Object.values(agency).some(hasEdit)) perms.add('MANAGE_AGENCY_CRM');

  const resources = moduleOpts('Resources');
  if (Object.values(resources).some(hasView)) perms.add('VIEW_RESOURCES');
  if (Object.values(resources).some(hasEdit)) perms.add('MANAGE_RESOURCES');

  const studentPortal = moduleOpts('Student Portal');
  if (Object.values(studentPortal).some(hasView)) perms.add('VIEW_STUDENT_PORTAL');

  const hr = moduleOpts('HR');
  const hrHasView = Object.values(hr).some(hasView);
  const hrHasEdit = Object.values(hr).some(hasEdit);
  if (hrHasView || hrHasEdit) {
    perms.add('VIEW_HR');
    if (hasView(hr.Attendance) || hasEdit(hr.Attendance)) {
      perms.add('VIEW_ATTENDANCE');
    }
    if (hasView(hr['Leave Management']) || hasEdit(hr['Leave Management'])) {
      perms.add('VIEW_LEAVE');
    }
    if (hasView(hr['Payroll Inputs']) || hasEdit(hr['Payroll Inputs'])) {
      perms.add('VIEW_OWN_PAYSLIP');
    }
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

export const resolveEffectivePermissions = (user, permissionMap) => {
  if (!user?.role) return [];

  const role = user.permissionRole || user.role;
  const normalizedRole = normalizeRole(role);

  if (hasConfiguredModuleAccess(user.moduleAccess)) {
    return moduleAccessToPermissions(user.moduleAccess);
  }

  if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'GLOBAL_ADMIN') {
    return fullAccessPermissions();
  }

  return permissionMap?.[normalizedRole] || ROLE_PERMISSIONS[normalizedRole] || [];
};

export const userCan = (user, requirement, permissionMap) => {
  const required = Array.isArray(requirement) ? requirement : [requirement];
  const effective = resolveEffectivePermissions(user, permissionMap);
  return required.some((permission) => effective.includes(permission));
};
