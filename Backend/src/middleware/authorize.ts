import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { prisma } from '../prisma.js';

export const authorizeRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;

        if (!userRole || !allowedRoles.includes(userRole)) {
            return sendError(res, 'Forbidden: insufficient permissions', null, 403);
        }

        next();
    };
};

export const authorizePermission = (moduleName: string, optionName: string, requiredAction: 'VIEW' | 'EDIT') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return sendError(res, 'Unauthorized', null, 401);
        }

        const { id, role } = req.user;

        // SUPER_ADMIN bypasses all permission checks
        if (role === 'SUPER_ADMIN') {
            return next();
        }

        try {
            const user = await prisma.user.findUnique({
                where: { id },
                select: { moduleAccess: true },
            });

            if (!user) {
                return sendError(res, 'User not found', null, 404);
            }

            let access = user.moduleAccess as Record<string, Record<string, string[]>> | null;
            if (!access) {
                // Dynamic import to avoid circular dependency
                const { getDefaultModuleAccessByRole } = await import('../modules/users/user.service.js');
                access = getDefaultModuleAccessByRole(role);
            }

            const options = access?.[moduleName];
            const actions = options?.[optionName];

            if (actions && actions.includes(requiredAction)) {
                return next();
            }

            return sendError(res, 'Forbidden: insufficient module permissions', null, 403);
        } catch (error) {
            next(error);
        }
    };
};
