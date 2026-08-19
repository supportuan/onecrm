import { Request } from 'express';

/** @deprecated Tenant context is gone; kept so older HR call sites compile during cleanup. */
export class TenantRequiredError extends Error {
  status = 403;
  constructor() {
    super('Organization context is required for this request');
    this.name = 'TenantRequiredError';
  }
}

export const requireTenant = (_req: Request): number => 1;
export const tenantOf = (_req: Request): number | null => null;
