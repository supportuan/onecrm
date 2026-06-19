import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { prisma } from '../prisma.js';
import { getEnabledModules } from '../modules/rbac/tenant-modules.service.js';

// Maps the legacy moduleName (used by authorizePermission) to the new
// TenantModule catalog key. Keep in sync with MODULE_CATALOG.
const LEGACY_MODULE_TO_KEY: Record<string, string> = {
    'Marketing': 'MARKETING',
    'Student CRM': 'STUDENT_CRM',
    'Agency CRM': 'AGENCY_CRM',
    'HR': 'HR',
    'Admin & Settings': 'ADMIN',
};

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

        // Tenant module gate: if the tenant has this module disabled, block.
        try {
            const moduleKey = LEGACY_MODULE_TO_KEY[moduleName];
            const tenantId = req.tenantId ?? req.user?.tenantId ?? null;
            if (moduleKey) {
                if (tenantId == null) {
                    return sendError(res, 'Forbidden: user is not associated with a tenant', null, 403);
                }
                const enabled = await getEnabledModules(tenantId);
                if (!enabled.has(moduleKey as any)) {
                    return sendError(res, 'Forbidden: module disabled for this tenant', null, 403);
                }
            }
        } catch (err) {
            return sendError(res, 'Authorization check failed', null, 500);
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
