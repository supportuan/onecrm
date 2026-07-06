import { HrAccessRole, UserRole } from '@prisma/client';

/** Map CRM login role → HR employee access role */
export function userRoleToHrAccessRole(role: UserRole): HrAccessRole {
  switch (role) {
    case UserRole.GLOBAL_ADMIN:
    case UserRole.HR:
      return HrAccessRole.HR_MANAGER;
    case UserRole.COUNSELLOR:
      return HrAccessRole.COUNSELLOR;
    default:
      return HrAccessRole.EMPLOYEE;
  }
}

export function hrAccessRoleDefaults(role: HrAccessRole): {
  department?: string;
  designation?: string;
} {
  if (role === HrAccessRole.COUNSELLOR) {
    return { department: 'Counselling', designation: 'Counsellor' };
  }
  return {};
}
