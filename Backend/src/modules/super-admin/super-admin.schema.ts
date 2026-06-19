import { z } from 'zod';
import { MODULE_CATALOG } from '../rbac/rbac.constants.js';

const moduleKeyEnum = z.enum(
  MODULE_CATALOG.map((m) => m.key) as [string, ...string[]],
);

export const createTenantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, digits, or hyphens'),
  modules: z.array(moduleKeyEnum).min(1, 'enable at least one module'),
  admin: z.object({
    fullName: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(8),
    phone: z.string().optional(),
  }),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']).optional(),
});

export const setModulesSchema = z.object({
  modules: z.array(moduleKeyEnum),
});
