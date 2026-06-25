import { z } from 'zod';

const moduleAccessSchema = z
  .record(z.string(), z.record(z.string(), z.array(z.enum(['VIEW', 'EDIT']))))
  .optional()
  .nullable();

const systemRoleEnum = z.enum([
  'SUPER_ADMIN',
  'GLOBAL_ADMIN',
  'COUNSELLOR',
  'STUDENT',
  'HR',
  'AGENT',
  'MARKETING_MANAGER',
  'TELECALLER',
  'AGENCY_FREELANCER',
]);

export const createUserSchema = z
  .object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional().nullable(),
    password: z.string().min(8).optional(),
    /** Super admin: must be GLOBAL_ADMIN. Global admin: omit and use roleName. */
    role: systemRoleEnum.optional(),
    /** Free-form role label (global admin only). */
    roleName: z.string().min(2).max(80).optional(),
    agencyDetails: z
      .object({
        agencyName: z.string().min(1),
        agencyCode: z.string().optional().nullable(),
        agencyAddress: z.string().optional().nullable(),
        agencyCity: z.string().optional().nullable(),
        agencyCountry: z.string().optional().nullable(),
      })
      .optional()
      .nullable(),
    moduleAccess: moduleAccessSchema,
    linkHrEmployeeId: z.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.role && !data.roleName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'role or roleName is required',
        path: ['roleName'],
      });
    }
  });

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  role: systemRoleEnum.optional(),
  roleName: z.string().min(2).max(80).optional(),
  isActive: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  counsellorId: z.number().optional().nullable(),
  moduleAccess: moduleAccessSchema,
});
