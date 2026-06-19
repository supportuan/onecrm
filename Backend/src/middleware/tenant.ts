import { Request, Response, NextFunction } from 'express';

// Populates req.tenantId from the authenticated user's JWT claim.
// Must run AFTER authenticateToken on protected routes; for public routes
// it is a no-op (req.tenantId stays undefined).
export const tenantMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user) {
    req.tenantId = req.user.tenantId ?? null;
  }

  if (process.env.DEBUG_TENANT === 'true') {
    console.log(`[Tenant] user=${req.user?.id ?? 'anon'} tenant=${req.tenantId ?? 'none'}`);
  }

  next();
};
