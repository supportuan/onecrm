import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import * as userService from './user.service.js';
import { createUserSchema, updateUserSchema } from './user.schema.js';
import { isForbiddenRoleName } from '../../utils/role-permissions.js';

const sendSuccess = (res: Response, message: string, data: any = null, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res: Response, message: string, status = 400) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

const validateCreatePayload = (
  currentRole: UserRole,
  body: { role?: UserRole; roleName?: string }
): string | null => {
  if (currentRole === UserRole.SUPER_ADMIN) {
    if (body.role !== UserRole.GLOBAL_ADMIN) {
      return 'Super admin can only create Global Admin users';
    }
    if (body.roleName) {
      return 'Use role GLOBAL_ADMIN only when creating users as super admin';
    }
    return null;
  }

  if (currentRole === UserRole.GLOBAL_ADMIN) {
    if (body.role === UserRole.SUPER_ADMIN) {
      return 'You cannot create Super Admin users';
    }
    if (!body.roleName?.trim()) {
      return 'Role name is required';
    }
    if (isForbiddenRoleName(body.roleName)) {
      return 'You cannot create a Super Admin role';
    }
    return null;
  }

  return 'Forbidden: insufficient permissions';
};

// SUPER_ADMIN: cross-tenant (null). Anyone else: locked to their tenantId.
const scopeFor = (req: Request): number | null => {
  if (req.user?.role === UserRole.SUPER_ADMIN) return null;
  return req.user?.tenantId ?? null;
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !([UserRole.SUPER_ADMIN, UserRole.GLOBAL_ADMIN] as UserRole[]).includes(req.user.role)) {
      return sendError(res, 'Forbidden: insufficient permissions', 403);
    }

    const role = req.query.role as UserRole | undefined;
    const data = await userService.getUsers(role, scopeFor(req));
    return sendSuccess(res, 'Users fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return sendError(res, 'Invalid user ID', 400);
    }

    if (!req.user) return sendError(res, 'Unauthorized', 401);
    if (req.user.id !== id && !([UserRole.SUPER_ADMIN, UserRole.GLOBAL_ADMIN] as UserRole[]).includes(req.user.role)) {
      return sendError(res, 'Forbidden: insufficient permissions', 403);
    }

    const scope = req.user.id === id ? null : scopeFor(req);
    const user = await userService.getUserById(id, scope);
    if (!user) return sendError(res, 'User not found', 404);

    return sendSuccess(res, 'User fetched successfully', user);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !([UserRole.SUPER_ADMIN, UserRole.GLOBAL_ADMIN] as UserRole[]).includes(req.user.role)) {
      return sendError(res, 'Forbidden: insufficient permissions', 403);
    }

    const data = createUserSchema.parse(req.body);
    const validationError = validateCreatePayload(req.user.role, data);
    if (validationError) {
      return sendError(res, validationError, 403);
    }

    const user = await userService.createUser({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone ?? undefined,
      password: data.password,
      role: data.role,
      roleName: data.roleName,
      agencyDetails: data.agencyDetails ?? undefined,
      moduleAccess: data.moduleAccess ?? undefined,
      tenantId: scopeFor(req),
      linkHrEmployeeId: data.linkHrEmployeeId,
    });
    return sendSuccess(res, 'User created successfully', user, 201);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return sendError(res, 'Invalid user ID', 400);
    }

    if (!req.user || !([UserRole.SUPER_ADMIN, UserRole.GLOBAL_ADMIN] as UserRole[]).includes(req.user.role)) {
      return sendError(res, 'Forbidden: insufficient permissions', 403);
    }

    const data = updateUserSchema.parse(req.body);
    if (data.roleName && isForbiddenRoleName(data.roleName)) {
      return sendError(res, 'You cannot assign a Super Admin role name', 403);
    }
    if (data.role === UserRole.SUPER_ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
      return sendError(res, 'You cannot assign Super Admin role', 403);
    }

    const updated = await userService.updateUser(
      id,
      {
        ...data,
        phone: data.phone ?? undefined,
      },
      scopeFor(req)
    );
    return sendSuccess(res, 'User updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return sendError(res, 'Invalid user ID', 400);
    }

    if (!req.user || !([UserRole.SUPER_ADMIN, UserRole.GLOBAL_ADMIN] as UserRole[]).includes(req.user.role)) {
      return sendError(res, 'Forbidden: insufficient permissions', 403);
    }

    const data = await userService.deactivateUser(id, scopeFor(req));
    return sendSuccess(res, 'User deactivated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getCounsellors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await userService.getCounsellors(scopeFor(req));
    return sendSuccess(res, 'Counsellors fetched successfully', data);
  } catch (error) {
    next(error);
  }
};
