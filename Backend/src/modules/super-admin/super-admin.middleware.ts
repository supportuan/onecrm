import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../utils/response.js';

/**
 * Gate that allows only SUPER_ADMIN users through. Cross-tenant: super admin
 * is not bound to any tenantId (req.tenantId is null for them).
 */
export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', null, 401);
  }
  if (req.user.role !== 'SUPER_ADMIN') {
    return sendError(res, 'Forbidden: super admin only', null, 403);
  }
  next();
};
