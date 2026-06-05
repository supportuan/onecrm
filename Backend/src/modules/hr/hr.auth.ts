import { authenticateToken } from '../../middleware/authenticate.js';
import { authorizeRole } from '../../middleware/authorize.js';

/** Roles with full HR module access */
export const HR_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR'] as const;

export const requireHrAuth = authenticateToken;
export const requireHrAdmin = authorizeRole(...HR_ADMIN_ROLES);
