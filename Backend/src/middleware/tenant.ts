import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenantId?: string;
}

export const tenantMiddleware = (req: TenantRequest, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] || 'default-tenant';
  req.tenantId = tenantId as string;
  
  // Log the tenant routing context
  console.log(`[Tenant Route Context] Request routed to tenant: ${tenantId}`);
  
  next();
};
