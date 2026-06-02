import { z } from 'zod';

export const createUserSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional().nullable(),
    password: z.string().min(8),
    role: z.enum(['ADMIN', 'COUNSELLOR', 'STUDENT', 'HR']),
});

export const updateUserSchema = z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().optional().nullable(),
    role: z.enum(['ADMIN', 'COUNSELLOR', 'STUDENT', 'HR']).optional(),
    isActive: z.boolean().optional(),
});
