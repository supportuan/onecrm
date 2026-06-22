import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response.js';
import { ALL_PERMISSIONS } from './rbac.constants.js';
import {
  getPermissionsMap,
  updateRolePermissions,
  resetToDefaults,
} from './rbac.service.js';

// Pull the tenant the caller is allowed to read/write RBAC for.
// SUPER_ADMIN may pass ?tenantId=… to inspect another tenant.
const tenantFor = (req: Request): number | null => {
  if (req.user?.role === 'SUPER_ADMIN') {
    const q = req.query.tenantId;
    if (typeof q === 'string' && q.length > 0) {
      const n = Number(q);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }
  return req.tenantId ?? req.user?.tenantId ?? null;
};

/** Returns the role -> permissions map for the caller's tenant + the catalog. */
export const getPermissions = async (req: Request, res: Response) => {
  try {
    const tenantId = tenantFor(req);
    if (tenantId == null && req.user?.role !== 'SUPER_ADMIN') {
      return sendError(res, 'No tenant context', null, 400);
    }
    // Super admin without ?tenantId returns the static catalog only.
    const roles = tenantId == null ? {} : await getPermissionsMap(tenantId);
    return sendSuccess(res, 'Permissions loaded', {
      roles,
      catalog: ALL_PERMISSIONS,
      tenantId,
    });
  } catch (err) {
    return sendError(res, 'Failed to load permissions', null, 500);
  }
};

/** Update permissions for a single role within the caller's tenant. */
export const updatePermissions = async (req: Request, res: Response) => {
  const role = req.params.role;
  const { permissions } = req.body ?? {};

  if (!role) {
    return sendError(res, 'Role is required', null, 400);
  }
  if (!Array.isArray(permissions)) {
    return sendError(res, 'permissions must be an array of strings', null, 400);
  }

  const tenantId = tenantFor(req);
  if (tenantId == null) {
    return sendError(res, 'Cannot edit roles without a tenant context', null, 400);
  }

  try {
    const saved = await updateRolePermissions(tenantId, role as string, permissions);
    const roles = await getPermissionsMap(tenantId);
    return sendSuccess(res, `Permissions updated for ${role}`, {
      role,
      permissions: saved,
      roles,
      tenantId,
    });
  } catch (err) {
    return sendError(res, 'Failed to update permissions', null, 500);
  }
};

/** Restore all roles to defaults within the caller's tenant. */
export const resetPermissions = async (req: Request, res: Response) => {
  const tenantId = tenantFor(req);
  if (tenantId == null) {
    return sendError(res, 'Cannot reset roles without a tenant context', null, 400);
  }
  try {
    const roles = await resetToDefaults(tenantId);
    return sendSuccess(res, 'Permissions reset to defaults', { roles, tenantId });
  } catch (err) {
    return sendError(res, 'Failed to reset permissions', null, 500);
  }
};
