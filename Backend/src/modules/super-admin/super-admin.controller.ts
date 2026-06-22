import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/response.js';
import * as svc from './super-admin.service.js';
import * as audit from './audit.service.js';
import {
  createTenantSchema,
  setModulesSchema,
  updateTenantSchema,
} from './super-admin.schema.js';
import type { ModuleKey } from '../rbac/rbac.constants.js';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createTenantSchema.parse(req.body);
    const result = await svc.createTenant({
      ...data,
      modules: data.modules as ModuleKey[],
    });
    await audit.logSuperAdminAction(req.user!.id, 'tenant.create', result.tenant.id, {
      name: data.name,
      slug: data.slug,
      modules: data.modules,
      adminEmail: data.admin.email,
    });
    return sendSuccess(res, 'Tenant created', result, 201);
  } catch (err: any) {
    if (err?.message?.includes('already in use')) {
      return sendError(res, err.message, null, 409);
    }
    next(err);
  }
};

export const list = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = await svc.listTenants();
    return sendSuccess(res, 'Tenants', tenants);
  } catch (err) {
    next(err);
  }
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, 'Invalid tenant id', null, 400);
    const tenant = await svc.getTenant(id);
    if (!tenant) return sendError(res, 'Tenant not found', null, 404);
    return sendSuccess(res, 'Tenant', tenant);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, 'Invalid tenant id', null, 400);
    const data = updateTenantSchema.parse(req.body);
    const tenant = await svc.updateTenant(id, data);
    await audit.logSuperAdminAction(req.user!.id, 'tenant.update', id, data);
    return sendSuccess(res, 'Tenant updated', tenant);
  } catch (err) {
    next(err);
  }
};

export const resetAdminPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, 'Invalid tenant id', null, 400);
    const provided = typeof req.body?.password === 'string' ? req.body.password : undefined;
    const result = await svc.resetPrimaryAdminPassword(id, provided);
    // Audit records WHICH admin and that a reset occurred — never the password.
    await audit.logSuperAdminAction(req.user!.id, 'tenant.resetAdminPassword', id, {
      adminEmail: result.email,
    });
    return sendSuccess(res, 'Password reset', result);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const listAudits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 200;
    const rows = await audit.listAudits(limit);
    return sendSuccess(res, 'Audits', rows);
  } catch (err) {
    next(err);
  }
};

export const setModules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, 'Invalid tenant id', null, 400);
    const data = setModulesSchema.parse(req.body);
    const tenant = await svc.updateTenantModules(id, data.modules as ModuleKey[]);
    await audit.logSuperAdminAction(req.user!.id, 'tenant.setModules', id, {
      modules: data.modules,
    });
    return sendSuccess(res, 'Tenant modules updated', tenant);
  } catch (err: any) {
    if (err?.message === 'Tenant not found') return sendError(res, err.message, null, 404);
    next(err);
  }
};
