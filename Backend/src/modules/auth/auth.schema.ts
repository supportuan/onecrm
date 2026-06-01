import { z } from 'zod';

export const registerSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional().nullable(),
    password: z.string().min(8),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'COUNSELLOR', 'STUDENT', 'HR']),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8),
});
