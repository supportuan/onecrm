import { z } from 'zod';

export const websiteLeadSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name is required'),

  email: z
    .string()
    .trim()
    .email('Please enter a valid email address'),

  phone: z
    .string()
    .trim()
    .optional()
    .nullable(),

  country: z
    .string()
    .trim()
    .optional()
    .nullable(),

  preferredCountry: z
    .string()
    .trim()
    .optional()
    .nullable(),

  preferredCourse: z
    .string()
    .trim()
    .optional()
    .nullable(),

  message: z
    .string()
    .trim()
    .optional()
    .nullable(),

  utmSource: z
    .string()
    .trim()
    .optional()
    .nullable(),

  utmMedium: z
    .string()
    .trim()
    .optional()
    .nullable(),

  utmCampaign: z
    .string()
    .trim()
    .optional()
    .nullable(),

  utmTerm: z
    .string()
    .trim()
    .optional()
    .nullable(),

  utmContent: z
    .string()
    .trim()
    .optional()
    .nullable(),
});

export type WebsiteLeadInput =
  z.infer<typeof websiteLeadSchema>;