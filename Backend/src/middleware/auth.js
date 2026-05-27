import jwt from 'jsonwebtoken';

// In-memory store for custom tenant permissions
// Key: tenantId, Value: { ROLE: [PERMISSIONS] }
export const customPermissionsStore = {};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Try header first, fallback to cookie "auth-token"
  let token = authHeader && authHeader.split(' ')[1];
  if (!token && req.cookies) {
    token = req.cookies['auth-token'];
  }
  if (!token && req.headers.cookie) {
    const rawCookies = req.headers.cookie.split(';');
    const parsedCookies = {};
    rawCookies.forEach(rawCookie => {
      const parsedCookie = rawCookie.split('=');
      if (parsedCookie[0]) {
        parsedCookies[parsedCookie[0].trim()] = (parsedCookie[1] || '').trim();
      }
    });
    token = parsedCookies['auth-token'];
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// Platform-standard permissions definition matching rbac.ts/js
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    'VIEW_ALL_EMPLOYEES', 'MANAGE_EMPLOYEES', 'MANAGE_PAYROLL', 'VIEW_OWN_PAYSLIP',
    'MANAGE_BIOMETRICS', 'MANAGE_NETWORK_SECURITY', 'MANAGE_SCHEDULING',
    'VIEW_TEAM', 'MANAGE_TEAM', 'VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE', 'VIEW_LEAVE', 'MANAGE_LEAVE',
    'MANAGE_ADMINS', 'MANAGE_SUPPORT_REQUESTS', 'MANAGE_SYSTEM', 'VIEW_REPORTS'
  ],
  GLOBAL_ADMIN: [
    'VIEW_ALL_EMPLOYEES', 'MANAGE_EMPLOYEES', 'VIEW_OWN_PAYSLIP',
    'MANAGE_BIOMETRICS', 'MANAGE_NETWORK_SECURITY', 'MANAGE_SCHEDULING',
    'VIEW_TEAM', 'MANAGE_TEAM', 'VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE', 'VIEW_LEAVE', 'MANAGE_LEAVE',
    'MANAGE_SUPPORT_REQUESTS', 'MANAGE_SYSTEM', 'VIEW_REPORTS', 'MANAGE_PAYROLL'
  ],
  ADMIN: [
    'VIEW_ALL_EMPLOYEES', 'MANAGE_EMPLOYEES', 'MANAGE_PAYROLL', 'VIEW_OWN_PAYSLIP',
    'MANAGE_BIOMETRICS', 'VIEW_TEAM', 'MANAGE_TEAM', 'VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE', 'VIEW_LEAVE', 'MANAGE_LEAVE',
    'MANAGE_SUPPORT_REQUESTS', 'MANAGE_SYSTEM', 'VIEW_REPORTS'
  ],
  HR_MANAGER: [
    'VIEW_ALL_EMPLOYEES', 'MANAGE_EMPLOYEES', 'MANAGE_PAYROLL', 'VIEW_OWN_PAYSLIP',
    'VIEW_TEAM', 'MANAGE_TEAM', 'VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE', 'VIEW_LEAVE', 'MANAGE_LEAVE',
    'MANAGE_SUPPORT_REQUESTS', 'VIEW_REPORTS', 'MANAGE_SYSTEM'
  ],
  HR: [
    'VIEW_ALL_EMPLOYEES', 'MANAGE_EMPLOYEES', 'MANAGE_PAYROLL', 'VIEW_OWN_PAYSLIP',
    'VIEW_TEAM', 'MANAGE_TEAM', 'VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE', 'VIEW_LEAVE', 'MANAGE_LEAVE',
    'MANAGE_SUPPORT_REQUESTS', 'VIEW_REPORTS', 'MANAGE_SYSTEM'
  ],
  HR_EXECUTIVE: [
    'VIEW_ALL_EMPLOYEES', 'VIEW_OWN_PAYSLIP', 'VIEW_TEAM', 'VIEW_ATTENDANCE', 'VIEW_LEAVE', 'MANAGE_LEAVE'
  ],
  PAYROLL_ADMIN: [
    'VIEW_ALL_EMPLOYEES', 'MANAGE_PAYROLL', 'VIEW_OWN_PAYSLIP', 'VIEW_ATTENDANCE', 'VIEW_REPORTS'
  ],
  IT_ADMIN: [
    'VIEW_OWN_PAYSLIP', 'MANAGE_BIOMETRICS', 'MANAGE_NETWORK_SECURITY', 'VIEW_ATTENDANCE', 'VIEW_LEAVE'
  ],
  LEARNING_ADMIN: [
    'VIEW_OWN_PAYSLIP', 'MANAGE_SCHEDULING', 'VIEW_ATTENDANCE'
  ],
  MANAGER: [
    'VIEW_OWN_PAYSLIP', 'VIEW_TEAM', 'MANAGE_TEAM', 'VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE', 'VIEW_LEAVE', 'MANAGE_LEAVE'
  ],
  TEAM_LEAD: [
    'VIEW_OWN_PAYSLIP', 'VIEW_TEAM', 'MANAGE_TEAM', 'VIEW_ATTENDANCE', 'VIEW_LEAVE'
  ],
  HOD: [
    'VIEW_OWN_PAYSLIP',
    'VIEW_TEAM', 'MANAGE_TEAM', 'VIEW_ATTENDANCE', 'VIEW_LEAVE', 'MANAGE_LEAVE'
  ],
  PRINCIPAL: [
    'VIEW_ALL_EMPLOYEES', 'MANAGE_EMPLOYEES', 'MANAGE_PAYROLL', 'VIEW_OWN_PAYSLIP',
    'VIEW_TEAM', 'MANAGE_TEAM', 'VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE', 'VIEW_LEAVE', 'MANAGE_LEAVE',
    'VIEW_REPORTS'
  ],
  DIRECTOR: [
    'VIEW_ALL_EMPLOYEES', 'MANAGE_EMPLOYEES', 'MANAGE_PAYROLL', 'VIEW_OWN_PAYSLIP',
    'VIEW_TEAM', 'MANAGE_TEAM', 'VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE', 'VIEW_LEAVE', 'MANAGE_LEAVE',
    'VIEW_REPORTS'
  ],
  FACULTY: [
    'VIEW_OWN_PAYSLIP', 'VIEW_SCHEDULE', 'VIEW_TEAM', 'VIEW_ATTENDANCE', 'VIEW_LEAVE'
  ],
  EMPLOYEE: [
    'VIEW_OWN_PAYSLIP', 'VIEW_TEAM', 'VIEW_ATTENDANCE', 'VIEW_LEAVE'
  ],
  STAFF: [
    'VIEW_OWN_PAYSLIP', 'VIEW_TEAM', 'VIEW_ATTENDANCE', 'VIEW_LEAVE'
  ],
  NON_TEACHING: [
    'VIEW_OWN_PAYSLIP', 'VIEW_TEAM', 'VIEW_ATTENDANCE', 'VIEW_LEAVE', 'VIEW_NON_TEACHING_DASHBOARD'
  ],
  PENDING: [],
  EXPENSE_MANAGER: [
    'VIEW_OWN_PAYSLIP', 'VIEW_TEAM', 'VIEW_ATTENDANCE'
  ],
  TEACHING: [
    'VIEW_OWN_PAYSLIP', 'VIEW_TEAM', 'VIEW_ATTENDANCE', 'VIEW_LEAVE'
  ],
  AGENT: [
    'VIEW_PROFILE', 'VIEW_ASSOCIATED_STUDENTS', 'MANAGE_STUDENT_DOCUMENTS',
    'CONTACT_UNIVERSITY_POC', 'MAKE_TUITION_PAYMENTS'
  ],
  STUDENT: [
    'VIEW_PROFILE'
  ],
};

export const hasPermission = (role, permission, customPermissions) => {
  if (!role || !permission) return false;
  const normalizedRole = role.toUpperCase().replace(/[-\s]/g, '_');

  if (customPermissions && customPermissions[normalizedRole]) {
    return customPermissions[normalizedRole].includes(permission);
  }

  const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
  return permissions.includes(permission);
};

export const requirePermission = (requirement) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { role, tenantId } = req.user;
    const customPermissions = tenantId ? customPermissionsStore[tenantId] : null;

    const requirements = Array.isArray(requirement) ? requirement : [requirement];
    const isAuthorized = requirements.some(permission => hasPermission(role, permission, customPermissions));

    if (!isAuthorized) {
      return res.status(403).json({ error: `Forbidden: Required permission is missing` });
    }

    next();
  };
};
