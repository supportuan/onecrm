import { AsyncLocalStorage } from 'node:async_hooks';
import { Request, Response, NextFunction } from 'express';

interface TenantContext {
  tenantId: number | null;
  bypass: boolean; // SUPER_ADMIN: skip tenant-scope auto-injection
}

const storage = new AsyncLocalStorage<TenantContext>();

export const getTenantContext = (): TenantContext | undefined => storage.getStore();

export const runWithTenant = <T>(ctx: TenantContext, fn: () => T): T =>
  storage.run(ctx, fn);

/**
 * Express middleware: enters an AsyncLocalStorage context for the rest of the
 * request so the Prisma client extension can auto-scope tenant-bound models.
 * Must run AFTER authenticateToken.
 */
export const tenantContextMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const tenantId = req.user?.tenantId ?? req.tenantId ?? null;
  const bypass = req.user?.role === 'SUPER_ADMIN';
  storage.run({ tenantId, bypass }, () => next());
};
