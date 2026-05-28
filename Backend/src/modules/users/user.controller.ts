import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import * as userService from './user.service.js';

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

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.query.role as UserRole | undefined;
    const data = await userService.getUsers(role);

    return sendSuccess(res, 'Users fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, phone, role } = req.body;

    if (!fullName || !email || !role) {
      return sendError(res, 'fullName, email and role are required');
    }

    const data = await userService.createUser({
      fullName,
      email,
      phone,
      role,
    });

    return sendSuccess(res, 'User created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return sendError(res, 'Invalid user ID');
    }

    const data = await userService.updateUser(id, req.body);

    return sendSuccess(res, 'User updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return sendError(res, 'Invalid user ID');
    }

    const data = await userService.deactivateUser(id);

    return sendSuccess(res, 'User deactivated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getCounsellors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await userService.getCounsellors();

    return sendSuccess(res, 'Counsellors fetched successfully', data);
  } catch (error) {
    next(error);
  }
};