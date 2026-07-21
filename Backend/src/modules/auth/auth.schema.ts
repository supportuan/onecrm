import { z } from 'zod';

export const registerSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional().nullable(),
    password: z.string().min(8),
    role: z.enum(['SUPER_ADMIN', 'GLOBAL_ADMIN', 'COUNSELLOR', 'STUDENT', 'HR', 'AGENT']),
    referralCode: z.string().optional().nullable(),
    agencyDetails: z.object({
        agencyName: z.string().min(1),
        agencyCode: z.string().optional().nullable(),
        agencyAddress: z.string().optional().nullable(),
        agencyCity: z.string().optional().nullable(),
        agencyCountry: z.string().optional().nullable(),
    }).optional().nullable(),
});

export const loginSchema = z.object({
    email: z.string().email().max(150),
    password: z.string().min(8).max(128),
    type: z.enum(['student', 'staff']).optional(),
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

export const acceptPolicySchema = z.object({
    accepted: z.literal(true),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8),
});
