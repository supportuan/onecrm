import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

const attachUserFromToken = (req: Request, token: string) => {
    const payload = verifyAccessToken(token);
    req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role as any,
        tenantId: payload.tenantId ?? null,
        permissionRole: payload.permissionRole ?? null,
    };
    req.tenantId = payload.tenantId ?? null;
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
        return sendError(res, 'Authentication token is required', null, 401);
    }

    try {
        attachUserFromToken(req, token);
        next();
    } catch (error) {
        return sendError(res, 'Invalid or expired access token', null, 401);
    }
};

/** Bearer header, `access_token` query, or `accessToken` cookie (for /uploads via browser). */
export const authenticateTokenOrCookie = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const queryToken = typeof req.query.access_token === 'string' ? req.query.access_token : undefined;
    const cookieHeader = req.headers.cookie || '';
    const cookieMatch = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
    const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : undefined;
    const token = bearer || queryToken || cookieToken;

    if (!token) {
        return sendError(res, 'Authentication token is required', null, 401);
    }

    try {
        attachUserFromToken(req, token);
        next();
    } catch (error) {
        return sendError(res, 'Invalid or expired access token', null, 401);
    }
};
