import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../utils/response.js';
import { hasPermission } from './rbac.service.js';

/**
 * Capability-based middleware backed by the live DB permission map.
 * Pass one or more permission strings; the request is allowed if the
 * user's role has ANY of them. Editing permissions in Admin Settings
 * takes effect immediately (cache refresh on update).
 */
export const requirePermission = (...required: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) {
      return sendError(res, 'Forbidden: no role assigned', null, 403);
    }
    try {
      const ok = await hasPermission(role, required);
      if (!ok) {
        return sendError(res, 'Forbidden: insufficient permissions', null, 403);
      }
      next();
    } catch (err) {
      return sendError(res, 'Authorization check failed', null, 500);
    }
  };
};
