import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../utils/response.js';
import { prisma } from '../../prisma.js';
import { hasUserPermission } from './rbac.service.js';

/**
 * Capability-based middleware backed by the live DB permission map.
 * Pass one or more permission strings; the request is allowed if the user's
 * role has ANY of the required permissions.
 *
 * Editing permissions in Admin Settings takes effect immediately
 * (cache refresh on update).
 */
export const requirePermission = (...required: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId || !Number.isFinite(Number(userId))) {
      return sendError(res, 'Forbidden: no role assigned', null, 403);
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          permissionRole: true,
          moduleAccess: true,
        },
      });

      if (!user) {
        return sendError(res, 'User not found', null, 401);
      }

      const ok = await hasUserPermission(user, required);
      if (!ok) {
        return sendError(res, 'Forbidden: insufficient permissions', null, 403);
      }
      next();
    } catch (err) {
      console.error('[RBAC] requirePermission failed', err);
      return sendError(res, 'Authorization check failed', null, 500);
    }
  };
};
