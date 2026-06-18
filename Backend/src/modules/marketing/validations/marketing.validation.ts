import { z } from 'zod';

// Lead Validation Schemas
export const createLeadSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  preferredCountry: z.string().optional().nullable(),
  preferredCourse: z.string().optional().nullable(),
  sourceId: z.number().int().optional().nullable(),
  assignedCounsellorId: z.number().int().optional().nullable(),
  assignedById: z.number().int().optional().nullable(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSED', 'CONVERTED', 'LOST']).optional(),
  rating: z.enum(['HOT', 'WARM', 'COLD', 'MAYBE']).optional(),
  remark: z.string().optional().nullable(),
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  utmTerm: z.string().optional().nullable(),
  utmContent: z.string().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const leadActivitySchema = z.object({
  activityType: z.enum(['NOTE', 'CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'MEETING']),
  comment: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

// Campaign Validation Schemas
export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),

  type: z.enum([
    'EMAIL',
    'SMS',
    'WHATSAPP',
    'SOCIAL_MEDIA',
    'PPC',
    'CONTENT',
  ]),

  budget: z.number().nonnegative().optional().nullable(),

  spent: z.number().nonnegative().optional(),

  startDate: z
    .string()
    .datetime()
    .or(z.string().date())
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),

  endDate: z
    .string()
    .datetime()
    .or(z.string().date())
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),

  status: z
    .enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'])
    .optional(),

  targetAudience: z.string().optional().nullable(),

  audienceType: z
    .enum(['ALL', 'HOT', 'WARM', 'COLD', 'MAYBE'])
    .optional()
    .default('ALL'),

  description: z.string().optional().nullable(),
});


export const updateCampaignSchema = createCampaignSchema.partial();

export const addCampaignLeadsSchema = z.object({
  leadIds: z.array(z.number().int()).min(1, 'At least one lead ID is required'),
  status: z.string().optional().nullable(),
  engagement: z.string().optional().nullable(),
});

// Automation Validation Schemas
export const createAutomationSchema = z.object({
  workflowName: z.string().min(1, 'Workflow name is required'),
  trigger: z.string().min(1, 'Trigger definition is required'),
  action: z.string().min(1, 'Action definition is required'),
  status: z.enum(['ACTIVE', 'PAUSED', 'DRAFT']).optional(),
  emailsSent: z.number().int().nonnegative().optional(),
  whatsappMessages: z.number().int().nonnegative().optional(),
  smsSent: z.number().int().nonnegative().optional(),
  leadsAutomated: z.number().int().nonnegative().optional(),
  engagementRate: z.number().nonnegative().max(100).optional(),
});

export const updateAutomationSchema = createAutomationSchema.partial();

// Landing Page Validation Schemas
export const createLandingPageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-_]+$/, 'Slug must be alphanumeric, hyphenated, or snake_cased'),
  type: z.enum(['COUNTRY', 'COURSE', 'INTAKE', 'CAMPAIGN', 'GUIDE', 'EVENT', 'FORM', 'APPLICATION']),
  country: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  visits: z.number().int().nonnegative().optional(),
  leads: z.number().int().nonnegative().optional(),
  conversionRate: z.number().nonnegative().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  formId: z.string().optional().nullable(),
});

export const updateLandingPageSchema = createLandingPageSchema.partial();

// Landing Page Submission Validation Schema
export const submitFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  preferredCountry: z.string().optional().nullable(),
  preferredCourse: z.string().optional().nullable(),
  sourceType: z.string().default('Website Form'), // e.g., Website Form, Facebook Ads, etc.
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  utmTerm: z.string().optional().nullable(),
  utmContent: z.string().optional().nullable(),
});

// Dashboard Data Validation Schemas
export const createDashboardMetricSchema = z.object({
  metricKey: z.string().min(1, 'Metric key is required'),
  metricValue: z.number(),
  trend: z.string().optional().nullable(),
  period: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export const updateDashboardMetricSchema = createDashboardMetricSchema.partial();

export const createIntakeTrendSchema = z.object({
  month: z.string().min(1, 'Month is required'),
  applications: z.number().int().nonnegative(),
  enrollments: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
});

export const updateIntakeTrendSchema = createIntakeTrendSchema.partial();

export const createStudentFunnelStageSchema = z.object({
  stage: z.string().min(1, 'Stage name is required'),
  count: z.number().int().nonnegative(),
  conversion: z.string().min(1, 'Conversion string is required'),
});

export const updateStudentFunnelStageSchema = createStudentFunnelStageSchema.partial();

export const createAgencyFunnelStageSchema = z.object({
  stage: z.string().min(1, 'Stage name is required'),
  count: z.number().int().nonnegative(),
  conversion: z.string().min(1, 'Conversion string is required'),
});

export const updateAgencyFunnelStageSchema = createAgencyFunnelStageSchema.partial();

export const createMarketingPerformanceSchema = z.object({
  day: z.string().min(1, 'Day name is required'),
  opens: z.number().int().nonnegative().optional(),
  clicks: z.number().int().nonnegative().optional(),
  conversions: z.number().int().nonnegative().optional(),
});

export const updateMarketingPerformanceSchema = createMarketingPerformanceSchema.partial();

export const createMarketingChannelAnalyticsSchema = z.object({
  channelName: z.string().min(1, 'Channel name is required'),
  percentage: z.number().nonnegative().max(100),
  totalLeads: z.number().int().nonnegative().optional(),
  totalConversions: z.number().int().nonnegative().optional(),
});

export const updateMarketingChannelAnalyticsSchema = createMarketingChannelAnalyticsSchema.partial();

export const createAgencyFunnelAnalyticsSchema = z.object({
  funnelName: z.string().min(1, 'Funnel name is required'),
  funnelValue: z.number().nonnegative(),
});

export const updateAgencyFunnelAnalyticsSchema = createAgencyFunnelAnalyticsSchema.partial();

