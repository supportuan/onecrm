import { sendError } from '../utils/response.js';
export const errorHandler = (err, req, res, next) => {
    console.error('Unhandled Error:', err);
    if (err.name === 'ZodError') {
        return sendError(res, 'Validation failed', err.errors, 400);
    }
    const authMessages = [
        'Invalid credentials',
        'Invalid refresh token',
        'Invalid or expired refresh token',
        'Invalid or expired access token',
        'Authentication token is required',
    ];
    if (authMessages.includes(err.message)) {
        return sendError(res, err.message, null, 401);
    }
    // Handle Prisma unique constraint violations etc.
    if (err.code && typeof err.code === 'string' && err.code.startsWith('P20')) {
        return sendError(res, `Database error: ${err.message}`, null, 409);
    }
    return sendError(res, err.message || 'Internal Server Error', null, 500);
};
