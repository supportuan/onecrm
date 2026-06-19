import { Request } from 'express';

/**
 * Pull the tenantId off an authenticated request, or throw if missing.
 * Use at the entry of every HR service method that touches a tenant-scoped
 * table. Super admin requests don't carry a tenantId and should not hit
 * tenant-scoped HR endpoints — the permission middleware already blocks them
 * by virtue of cross-tenant scope, but services should fail loud if reached.
 */
export class TenantRequiredError extends Error {
  status = 403;
  constructor() {
    super('Tenant context is required for this request');
    this.name = 'TenantRequiredError';
  }
}

export const requireTenant = (req: Request): number => {
  const id = req.tenantId ?? req.user?.tenantId ?? null;
  if (id == null) throw new TenantRequiredError();
  return id;
};

export const tenantOf = (req: Request): number | null => {
  return req.tenantId ?? req.user?.tenantId ?? null;
};
