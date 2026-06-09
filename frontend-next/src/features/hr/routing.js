import { ROLE_PERMISSIONS } from '@/lib/auth/rbac';

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

export const hasHrModuleAccess = (role) => getRolePermissions(role).includes('VIEW_HR');

/**
 * Employee self-service: has VIEW_HR plus leave/attendance/payslip access
 * but none of the HR operator capabilities.
 */
export const isHrSelfServiceOnly = (role) => {
  const perms = getRolePermissions(role);
  if (!perms.includes('VIEW_HR')) return false;
  const hasOperator = HR_OPERATOR_PERMS.some((p) => perms.includes(p));
  return !hasOperator;
};

/** Default landing route after login or home redirect. */
export const getDefaultHrRoute = (role) => {
  if (!hasHrModuleAccess(role)) return null;
  if (role === 'HR') return '/hr/employee-directory';
  if (isHrSelfServiceOnly(role)) return '/hr/me';
  return '/hr';
};
