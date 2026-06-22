import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../utils/response.js';
import { hasPermission } from './rbac.service.js';
import { PERMISSION_TO_MODULE } from './rbac.constants.js';
import { getEnabledModules } from './tenant-modules.service.js';

/**
 * Capability-based middleware backed by the live DB permission map.
 * Pass one or more permission strings; the request is allowed if:
 *   1. the user's role has ANY of the required permissions, AND
 *   2. the user's tenant has the owning module enabled (super admin bypasses).
 *
 * Editing permissions in Admin Settings takes effect immediately
 * (cache refresh on update). Toggling modules in Super Admin > Tenants also
 * takes effect immediately (tenant-modules cache invalidation on write).
 */
export const requirePermission = (...required: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) {
      return sendError(res, 'Forbidden: no role assigned', null, 403);
    }

    const tenantId = req.tenantId ?? null;

    try {
      const ok = await hasPermission(role, required, tenantId);
      if (!ok) {
        return sendError(res, 'Forbidden: insufficient permissions', null, 403);
      }

      // SUPER_ADMIN operates cross-tenant and is not module-gated.
      if (role === 'SUPER_ADMIN') {
        return next();
      }

      if (tenantId == null) {
        return sendError(res, 'Forbidden: user is not associated with a tenant', null, 403);
      }

      // Each required permission belongs to a module; the request is allowed
      // if at least one of the matched (granted) permissions is in an
      // enabled module. We re-check granted perms to find the matched ones.
      const enabled = await getEnabledModules(tenantId);
      const moduleAllowed = required.some((perm) => {
        const mod = PERMISSION_TO_MODULE[perm];
        return mod && enabled.has(mod);
      });

      if (!moduleAllowed) {
        return sendError(res, 'Forbidden: module disabled for this tenant', null, 403);
      }

      next();
    } catch (err) {
      return sendError(res, 'Authorization check failed', null, 500);
    }
  };
};
