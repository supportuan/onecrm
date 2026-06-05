import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission as requirePermissionDynamic } from '../rbac/rbac.middleware.js';

export const requireHrAuth = authenticateToken;

/**
 * Capability-based middleware, now backed by the live DB permission map
 * (see modules/rbac). Editing a role in Admin Settings > Roles & Permissions
 * takes effect immediately across all modules.
 */
export const requirePermission = requirePermissionDynamic;
