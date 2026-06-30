import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';

interface JWTPayload {
    id: number;
    email: string;
    role: string;
    tenantId: number | null;
    permissionRole?: string | null;
}

export const generateAccessToken = (payload: JWTPayload): string => {
    const secret = process.env.JWT_SECRET || 'default_secret_key_change_in_production';
    const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as SignOptions['expiresIn'];

    return jwt.sign(payload, secret, { expiresIn });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
    const secret = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key_change_in_production';
    const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

    // jwtid (jti) guarantees a unique token string per call. Without it, two
    // logins by the same user within the same second produce identical JWTs,
    // which collide on the RefreshToken.token unique constraint and crash login.
    return jwt.sign(payload, secret, { expiresIn, jwtid: randomUUID() });
};

export const verifyAccessToken = (token: string): JWTPayload => {
    const secret = process.env.JWT_SECRET || 'default_secret_key_change_in_production';

    try {
        return jwt.verify(token, secret) as JWTPayload;
    } catch (error) {
        throw new Error('Invalid or expired access token');
    }
};

export const verifyRefreshToken = (token: string): JWTPayload => {
    const secret = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key_change_in_production';

    try {
        return jwt.verify(token, secret) as JWTPayload;
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

export const decodeToken = (token: string): JWTPayload | null => {
    try {
        return jwt.decode(token) as JWTPayload;
    } catch (error) {
        return null;
    }
};
