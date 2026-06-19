import { authenticateToken } from '../../middleware/authenticate.js';
import { tenantContextMiddleware } from '../../middleware/tenant-context.js';
import { requirePermission as requirePermissionDynamic } from '../rbac/rbac.middleware.js';

// HR routes always need an authenticated user AND a tenant ALS scope so the
// Prisma extension can auto-inject tenantId on HR root models.
export const requireHrAuth = [authenticateToken, tenantContextMiddleware];

/**
 * Capability-based middleware, now backed by the live DB permission map
 * (see modules/rbac). Editing a role in Admin Settings > Roles & Permissions
 * takes effect immediately across all modules.
 */
export const requirePermission = requirePermissionDynamic;
