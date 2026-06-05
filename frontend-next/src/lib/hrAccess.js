/** Roles allowed to enter the HR module (sub-pages still apply their own gates) */
export const HR_ACCESS_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR', 'IT', 'COUNSELLOR', 'MARKETING'];

/** Roles allowed for payroll screens (HR operators only) */
export const HR_PAYROLL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR'];

/** Roles allowed for recruitment screens (HR operators only) */
export const HR_RECRUITMENT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR'];

export const canAccessHr = (role) => HR_ACCESS_ROLES.includes(role);
