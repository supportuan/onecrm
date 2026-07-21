import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';

interface JWTPayload {
    id: number;
    email: string;
    role: string;
    tenantId: number | null;
    permissionRole?: string | null;
}

const DEFAULT_ACCESS = 'default_secret_key_change_in_production';
const DEFAULT_REFRESH = 'default_refresh_secret_key_change_in_production';

const allowInsecureJwtDefaults = () => {
    const env = (process.env.NODE_ENV || '').toLowerCase();
    // Tests / local scripts may omit secrets; never in production/staging.
    return env === 'test' || process.env.ALLOW_INSECURE_JWT_DEFAULTS === 'true';
};

const requireSecret = (value: string | undefined, fallback: string, name: string): string => {
    const secret = (value || '').trim();
    if (secret && secret !== fallback) return secret;
    if (allowInsecureJwtDefaults()) return secret || fallback;
    throw new Error(
        `${name} must be set to a strong non-default value. Refusing to start with insecure JWT defaults.`
    );
};

export const getJwtAccessSecret = () =>
    requireSecret(process.env.JWT_SECRET, DEFAULT_ACCESS, 'JWT_SECRET');

export const getJwtRefreshSecret = () => {
    const refresh = (process.env.JWT_REFRESH_SECRET || '').trim();
    if (refresh && refresh !== DEFAULT_REFRESH) return refresh;
    // Prefer an explicit refresh secret; if only JWT_SECRET is set, derive a
    // distinct refresh secret so local/dev does not fall back to the insecure default.
    const access = (process.env.JWT_SECRET || '').trim();
    if (access && access !== DEFAULT_ACCESS) return `refresh:${access}`;
    return requireSecret(process.env.JWT_REFRESH_SECRET, DEFAULT_REFRESH, 'JWT_REFRESH_SECRET');
};

export const generateAccessToken = (payload: JWTPayload): string => {
    const secret = getJwtAccessSecret();
    const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as SignOptions['expiresIn'];

    return jwt.sign(payload, secret, { expiresIn });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
    const secret = getJwtRefreshSecret();
    const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

    // jwtid (jti) guarantees a unique token string per call. Without it, two
    // logins by the same user within the same second produce identical JWTs,
    // which collide on the RefreshToken.token unique constraint and crash login.
    return jwt.sign(payload, secret, { expiresIn, jwtid: randomUUID() });
};

export const verifyAccessToken = (token: string): JWTPayload => {
    const secret = getJwtAccessSecret();

    try {
        return jwt.verify(token, secret) as JWTPayload;
    } catch (error) {
        throw new Error('Invalid or expired access token');
    }
};

export const verifyRefreshToken = (token: string): JWTPayload => {
    const secret = getJwtRefreshSecret();

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
