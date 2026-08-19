import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response.js';
import { ALL_PERMISSIONS, SYSTEM_ROLES } from './rbac.constants.js';
import {
  getPermissionsMap,
  updateRolePermissions,
  resetToDefaults,
  createCustomRole,
  deleteCustomRole,
} from './rbac.service.js';

export const getPermissions = async (_req: Request, res: Response) => {
  try {
    const roles = await getPermissionsMap();
    return sendSuccess(res, 'Permissions loaded', {
      roles,
      catalog: ALL_PERMISSIONS,
      systemRoles: Array.from(SYSTEM_ROLES),
    });
  } catch (err) {
    return sendError(res, 'Failed to load permissions', null, 500);
  }
};

export const updatePermissions = async (req: Request, res: Response) => {
  const role = req.params.role;
  const { permissions } = req.body ?? {};

  if (!role) {
    return sendError(res, 'Role is required', null, 400);
  }
  if (!Array.isArray(permissions)) {
    return sendError(res, 'permissions must be an array of strings', null, 400);
  }

  try {
    const saved = await updateRolePermissions(role as string, permissions);
    const roles = await getPermissionsMap();
    return sendSuccess(res, `Permissions updated for ${role}`, {
      role,
      permissions: saved,
      roles,
      systemRoles: Array.from(SYSTEM_ROLES),
    });
  } catch (err) {
    return sendError(res, 'Failed to update permissions', null, 500);
  }
};

export const createRole = async (req: Request, res: Response) => {
  const { name, permissions } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim()) {
    return sendError(res, 'Role name is required', null, 400);
  }
  if (permissions != null && !Array.isArray(permissions)) {
    return sendError(res, 'permissions must be an array of strings', null, 400);
  }

  try {
    const created = await createCustomRole(
      name,
      Array.isArray(permissions) ? permissions : []
    );
    const roles = await getPermissionsMap();
    return sendSuccess(
      res,
      `Role ${created.role} created`,
      {
        ...created,
        roles,
        systemRoles: Array.from(SYSTEM_ROLES),
      },
      201
    );
  } catch (err: any) {
    const message = err?.message || 'Failed to create role';
    const status = /already exists|reserved|at least/i.test(message) ? 400 : 500;
    return sendError(res, message, null, status);
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  const role = req.params.role;
  if (!role) {
    return sendError(res, 'Role is required', null, 400);
  }

  const reassignTo =
    (typeof req.body?.reassignTo === 'string' && req.body.reassignTo) ||
    (typeof req.query.reassignTo === 'string' && req.query.reassignTo) ||
    undefined;

  try {
    const result = await deleteCustomRole(role as string, { reassignTo });
    const roles = await getPermissionsMap();
    return sendSuccess(res, `Role ${role} deleted`, {
      role,
      ...result,
      roles,
      systemRoles: Array.from(SYSTEM_ROLES),
    });
  } catch (err: any) {
    const message = err?.message || 'Failed to delete role';
    const status = /cannot delete|not found|assigned|reassign|different/i.test(message)
      ? 400
      : 500;
    return sendError(res, message, null, status);
  }
};

export const resetPermissions = async (_req: Request, res: Response) => {
  try {
    const roles = await resetToDefaults();
    return sendSuccess(res, 'Permissions reset to defaults', {
      roles,
      systemRoles: Array.from(SYSTEM_ROLES),
    });
  } catch (err) {
    return sendError(res, 'Failed to reset permissions', null, 500);
  }
};
