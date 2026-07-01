import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
        return sendError(res, 'Authentication token is required', null, 401);
    }

    try {
        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.id,
            email: payload.email,
            role: payload.role as any,
            tenantId: payload.tenantId ?? null,
            permissionRole: payload.permissionRole ?? null,
        };
        req.tenantId = payload.tenantId ?? null;
        next();
    } catch (error) {
        return sendError(res, 'Invalid or expired access token', null, 401);
    }
};
