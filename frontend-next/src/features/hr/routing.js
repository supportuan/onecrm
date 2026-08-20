import { ROLE_PERMISSIONS } from '@/lib/auth/rbac';
import { resolveEffectivePermissions } from '@/lib/auth/module-access';

const normalizeRole = (role) => (role || '').toUpperCase().replace(/[-\s]/g, '_');

/** Permissions that indicate HR operator / admin workspace (not self-service only). */
const HR_OPERATOR_PERMS = [
  'MANAGE_EMPLOYEES',
  'MANAGE_LEAVE',
  'MANAGE_ATTENDANCE',
  'MANAGE_PAYROLL',
  'VIEW_ALL_EMPLOYEES',
  'VIEW_REPORTS',
  'MANAGE_SYSTEM',
  'MANAGE_BIOMETRICS',
];

export const getRolePermissions = (role) => ROLE_PERMISSIONS[normalizeRole(role)] || [];

export const getEffectivePermissions = (user, permissionMap) =>
  user ? resolveEffectivePermissions(user, permissionMap) : [];

export const hasHrModuleAccess = (userOrRole, permissionMap = null) => {
  if (userOrRole && typeof userOrRole === 'object') {
    return getEffectivePermissions(userOrRole, permissionMap).includes('VIEW_HR');
  }
  return getRolePermissions(userOrRole).includes('VIEW_HR');
};

/**
 * Employee self-service: has VIEW_HR plus leave/attendance/payslip access
 * but none of the HR operator capabilities.
 */
export const isHrSelfServiceOnly = (userOrRole, permissionMap = null) => {
  const perms =
    userOrRole && typeof userOrRole === 'object'
      ? getEffectivePermissions(userOrRole, permissionMap)
      : getRolePermissions(userOrRole);
  if (!perms.includes('VIEW_HR')) return false;
  const hasOperator = HR_OPERATOR_PERMS.some((p) => perms.includes(p));
  return !hasOperator;
};

/** Default landing route after login or home redirect. */
export const getDefaultHrRoute = (userOrRole, permissionMap = null) => {
  if (!hasHrModuleAccess(userOrRole, permissionMap)) return null;
  const role = typeof userOrRole === 'object' ? userOrRole?.role : userOrRole;
  if (role === 'HR') return '/hr/employee-directory';
  return '/hr';
};
