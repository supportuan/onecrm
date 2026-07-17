import { z } from 'zod';

const idCoerce = z.coerce.number().int().positive();

export const createPartnerSchema = z.object({
  agencyName: z.string().trim().min(1),
  agencyCode: z.string().trim().optional(),
  userId: idCoerce.optional(),
  email: z.string().email().optional(),
  fullName: z.string().trim().optional(),
  password: z.string().min(6).optional(),
  phone: z.string().trim().optional().nullable(),
  contactPerson: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  country: z.string().trim().optional().nullable(),
  services: z.string().trim().optional().nullable(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  status: z
    .enum(['PENDING', 'VERIFIED', 'APPROVED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED'])
    .optional(),
  notes: z.string().optional().nullable(),
});

export const updatePartnerSchema = z.object({
  agencyName: z.string().trim().min(1).optional(),
  agencyCode: z.string().trim().optional(),
  contactPerson: z.string().trim().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  country: z.string().trim().optional().nullable(),
  services: z.string().trim().optional().nullable(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  status: z
    .enum(['PENDING', 'VERIFIED', 'APPROVED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED'])
    .optional(),
  branding: z.record(z.string(), z.unknown()).optional(),
  capabilities: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().optional().nullable(),
});

export const advanceOnboardingSchema = z.object({
  stage: z.enum([
    'REGISTERED',
    'DOCS_SUBMITTED',
    'AGREEMENT_SIGNED',
    'VERIFIED',
    'APPROVED',
    'ACTIVE',
  ]),
});

export const partnerStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'VERIFIED',
    'APPROVED',
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'BLACKLISTED',
  ]),
});

export const createReferralSchema = z
  .object({
    agencyPartnerId: idCoerce,
    leadId: idCoerce.optional().nullable(),
    studentId: idCoerce.optional().nullable(),
    applicationId: idCoerce.optional().nullable(),
    referralCode: z.string().trim().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine((d) => d.leadId || d.studentId || d.applicationId, {
    message: 'leadId, studentId, or applicationId is required',
  });

export const createCommissionSchema = z.object({
  agencyPartnerId: idCoerce,
  amount: z.coerce.number().positive(),
  currency: z.string().trim().min(1).optional(),
  studentId: idCoerce.optional().nullable(),
  applicationId: idCoerce.optional().nullable(),
  period: z.string().trim().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'APPROVED', 'PAID', 'CANCELLED']).optional(),
});

export const updateCommissionSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  currency: z.string().trim().min(1).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'PAID', 'CANCELLED']).optional(),
  period: z.string().trim().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const commissionRuleSchema = z.object({
  id: idCoerce.optional(),
  agencyPartnerId: idCoerce.optional().nullable(),
  country: z.string().trim().optional().nullable(),
  university: z.string().trim().optional().nullable(),
  ruleType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  amount: z.coerce.number().positive(),
  trigger: z.enum(['ENROLLED', 'VISA_APPROVED']).optional(),
  currency: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export const verifyCommissionSchema = z.object({
  approve: z.boolean().optional().default(true),
  notes: z.string().optional().nullable(),
});

export const createPayoutSchema = z.object({
  commissionIds: z.array(idCoerce).min(1),
  period: z.string().trim().optional().nullable(),
  currency: z.string().trim().optional(),
  notes: z.string().optional().nullable(),
});

export const payoutStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PROCESSING', 'PAID', 'CANCELLED']),
  notes: z.string().optional().nullable(),
});

export const createAnnouncementSchema = z.object({
  type: z.enum(['GENERAL', 'POLICY', 'SCHOLARSHIP', 'UNIVERSITY_UPDATE']).optional(),
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  link: z.string().trim().url().optional().nullable().or(z.literal('')),
  publish: z.boolean().optional().default(true),
});

export const verifyDocumentSchema = z.object({
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
  notes: z.string().optional().nullable(),
});

export const agentPaymentOrderSchema = z.object({
  feeId: idCoerce,
});

export const parseBody = <T>(schema: z.ZodType<T>, body: unknown): T => {
  const result = schema.safeParse(body);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join('; ') || 'invalid request';
    const err = new Error(msg);
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }
  return result.data;
};
