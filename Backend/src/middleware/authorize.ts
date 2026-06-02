import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export const authorizeRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;

        if (!userRole || !allowedRoles.includes(userRole)) {
            return sendError(res, 'Forbidden: insufficient permissions', null, 403);
        }

        next();
    };
};
