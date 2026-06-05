import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response.js';
import { ALL_PERMISSIONS } from './rbac.constants.js';
import {
  getPermissionsMap,
  updateRolePermissions,
  resetToDefaults,
} from './rbac.service.js';

/** Returns the full role -> permissions map + the permission catalog. */
export const getPermissions = async (_req: Request, res: Response) => {
  try {
    const roles = await getPermissionsMap();
    return sendSuccess(res, 'Permissions loaded', {
      roles,
      catalog: ALL_PERMISSIONS,
    });
  } catch (err) {
    return sendError(res, 'Failed to load permissions', null, 500);
  }
};

/** Update permissions for a single role (live across the app). */
export const updatePermissions = async (req: Request, res: Response) => {
  const { role } = req.params;
  const { permissions } = req.body ?? {};

  if (!role) {
    return sendError(res, 'Role is required', null, 400);
  }
  if (!Array.isArray(permissions)) {
    return sendError(res, 'permissions must be an array of strings', null, 400);
  }

  try {
    const saved = await updateRolePermissions(role, permissions);
    const roles = await getPermissionsMap();
    return sendSuccess(res, `Permissions updated for ${role}`, {
      role,
      permissions: saved,
      roles,
    });
  } catch (err) {
    return sendError(res, 'Failed to update permissions', null, 500);
  }
};

/** Restore all roles to their default permission sets. */
export const resetPermissions = async (_req: Request, res: Response) => {
  try {
    const roles = await resetToDefaults();
    return sendSuccess(res, 'Permissions reset to defaults', { roles });
  } catch (err) {
    return sendError(res, 'Failed to reset permissions', null, 500);
  }
};
