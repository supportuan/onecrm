import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);

  if (err.name === 'ZodError') {
    return sendError(res, 'Validation failed', err.errors, 400);
  }

  if (err.message === 'Invalid credentials') {
    return sendError(res, err.message, null, 401);
  }

  // Handle Prisma unique constraint violations etc.
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P20')) {
    return sendError(res, `Database error: ${err.message}`, null, 409);
  }

  return sendError(res, err.message || 'Internal Server Error', null, 500);
};
