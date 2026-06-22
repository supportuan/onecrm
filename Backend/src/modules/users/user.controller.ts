import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import * as userService from './user.service.js';
import { createUserSchema, updateUserSchema } from './user.schema.js';

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

const canCreateRole = (currentRole: UserRole, newRole: UserRole) => {
  if (currentRole === UserRole.SUPER_ADMIN && (newRole === UserRole.GLOBAL_ADMIN || newRole === UserRole.AGENT)) return true;
  if (currentRole === UserRole.GLOBAL_ADMIN && ([UserRole.COUNSELLOR, UserRole.HR, UserRole.STUDENT, UserRole.AGENT] as UserRole[]).includes(newRole)) return true;
  return false;
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

    // Users can always read their own profile; otherwise scope to tenant.
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
    if (!canCreateRole(req.user.role, data.role)) {
      return sendError(res, 'You are not allowed to create users with this role', 403);
    }

    const user = await userService.createUser({
      ...data,
      phone: data.phone ?? undefined,
      agencyDetails: (data as any).agencyDetails ?? undefined,
      tenantId: scopeFor(req),
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
    const updated = await userService.updateUser(id, {
      ...data,
      phone: data.phone ?? undefined,
    }, scopeFor(req));
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
