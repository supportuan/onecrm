/** Roles allowed to access the HR module */
export const HR_ACCESS_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR'];

/** Roles allowed for payroll screens */
export const HR_PAYROLL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR'];

/** Roles allowed for recruitment screens */
export const HR_RECRUITMENT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR'];

export const canAccessHr = (role) => HR_ACCESS_ROLES.includes(role);
