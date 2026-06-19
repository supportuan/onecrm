import { z } from 'zod';

export const createUserSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional().nullable(),
    password: z.string().min(8),
    role: z.enum(['SUPER_ADMIN','ADMIN', 'COUNSELLOR', 'STUDENT', 'HR', 'AGENT']),
    agencyDetails: z.object({
        agencyName: z.string().min(1),
        agencyCode: z.string().optional().nullable(),
        agencyAddress: z.string().optional().nullable(),
        agencyCity: z.string().optional().nullable(),
        agencyCountry: z.string().optional().nullable(),
    }).optional().nullable(),
    moduleAccess: z.record(z.string(), z.record(z.string(), z.array(z.enum(['VIEW', 'EDIT'])))).optional().nullable(),
});

export const updateUserSchema = z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().optional().nullable(),
    role: z.enum(['SUPER_ADMIN','ADMIN', 'COUNSELLOR', 'STUDENT', 'HR', 'AGENT']).optional(),
    isActive: z.boolean().optional(),
    isApproved: z.boolean().optional(),
    counsellorId: z.number().optional().nullable(),
    moduleAccess: z.record(z.string(), z.record(z.string(), z.array(z.enum(['VIEW', 'EDIT'])))).optional().nullable(),
});
