import { z } from 'zod';

const createDeviceBaseSchema = z.object({
  device_id: z.string(),
  device_name: z.string(),
  device_ip: z.string().optional(),
  deviceIp: z.string().optional(),
});

export const createDeviceSchema = createDeviceBaseSchema.refine(data => !!(data.device_ip || data.deviceIp), {
  message: "Either device_ip or deviceIp must be provided",
  path: ["device_ip"]
});

export const updateDeviceSchema = createDeviceBaseSchema.partial();

export const createNetworkSchema = z.object({
  ip_address_or_range: z.string(),
  label: z.string(),
  is_active: z.boolean().optional().default(true),
});

export const updateSettingsSchema = z.object({
  attendance_mode: z.string().optional(),
  enable_ip_validation: z.boolean().optional(),
  wfh_policy: z.any().optional(),
});

export const requestRegularizationSchema = z.object({
  date: z.string(),
  type: z.string(),
  time: z.string(),
  reason: z.string(),
});

export const processRegularizationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  approverRemarks: z.string().optional(),
});

export const createLeavePlanSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const createLeaveDefinitionSchema = z.object({
  leaveTypeId: z.string(),
  annual_quota: z.number().int().optional(),
  carry_forward: z.boolean().optional(),
});

export const assignLeaveEmployeesSchema = z.object({
  employeeIds: z.array(z.string()),
});

export const createHolidaySchema = z.object({
  name: z.string(),
  date: z.string(),
  is_restricted: z.boolean().optional().default(false),
});

export const executePayrollSchema = z.object({
  month: z.number(),
  year: z.number(),
});

export const createSalaryStructureSchema = z.object({
  employeeId: z.string(),
  basicSalary: z.number(),
  allowances: z.number(),
  deductions: z.number(),
});

// ---- New Sprint Feature Schemas ----

export const createOnboardingChecklistSchema = z.object({
  employeeId: z.string(),
  employeeName: z.string(),
  startDate: z.string(),
});

export const updateOnboardingItemSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED']),
  completedBy: z.string().optional(),
});

export const createOfferLetterSchema = z.object({
  candidateId: z.string(),
  candidateName: z.string(),
  candidateEmail: z.string().email(),
  jobTitle: z.string(),
  department: z.string(),
  offeredSalary: z.number(),
  joiningDate: z.string(),
  expiryDate: z.string(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).default('DRAFT'),
  policyTemplate: z.string().default('standard'),
});

export const updateOfferLetterStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
});

export const scheduleInterviewSchema = z.object({
  candidateId: z.string(),
  candidateName: z.string(),
  jobTitle: z.string(),
  round: z.string(),
  type: z.enum(['IN_PERSON', 'VIRTUAL', 'PHONE']),
  scheduledAt: z.string(),
  duration: z.number().int().positive(),
  interviewers: z.array(z.string()),
  meetingLink: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).default('SCHEDULED'),
});

export const updateInterviewStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
});

export const submitInterviewFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  technicalScore: z.number().optional(),
  communicationScore: z.number().optional(),
  recommendation: z.enum(['STRONG_HIRE', 'HIRE', 'MAYBE', 'NO_HIRE']),
  notes: z.string(),
  submittedBy: z.string(),
});

export const createJobPostingSchema = z.object({
  title: z.string(),
  department: z.string(),
  location: z.string(),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
  description: z.string(),
  requirements: z.string(),
  salaryRange: z.string(),
  status: z.enum(['DRAFT', 'OPEN', 'PAUSED', 'CLOSED']).default('DRAFT'),
  hiringManager: z.string(),
  postedAt: z.string().optional(),
  closingDate: z.string().optional(),
});

export const updateJobPostingStatusSchema = z.object({
  status: z.enum(['DRAFT', 'OPEN', 'PAUSED', 'CLOSED']),
});

export const addCandidateSchema = z.object({
  jobId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  resumeUrl: z.string().optional(),
  currentStage: z.string().default('application'),
  status: z.enum(['ACTIVE', 'REJECTED', 'HIRED', 'WITHDRAWN']).default('ACTIVE'),
});

export const updateCandidateStageSchema = z.object({
  stage: z.string(),
  status: z.enum(['ACTIVE', 'REJECTED', 'HIRED', 'WITHDRAWN']).optional(),
});

export const addProcessingMetricSchema = z.object({
  period: z.string(),
  totalApplications: z.number().int(),
  processedApplications: z.number().int(),
  accurateApplications: z.number().int(),
  avgTurnaroundDays: z.number(),
  reviewsCompleted: z.number().int(),
  pendingReviews: z.number().int(),
});

export const createKPIDefinitionSchema = z.object({
  role: z.string(),
  name: z.string(),
  description: z.string().optional(),
  target: z.number(),
  unit: z.string(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  isActive: z.boolean().default(true),
});

export const recordKPIMetricSchema = z.object({
  kpiId: z.string(),
  userId: z.string().optional(),
  userRole: z.string(),
  period: z.string(),
  actualValue: z.number(),
  targetValue: z.number(),
  notes: z.string().optional(),
});

export const addMarketingPerformanceSchema = z.object({
  period: z.string(),
  leadsGenerated: z.number().int(),
  costPerLead: z.number(),
  totalBudget: z.number(),
  channel: z.string(),
  conversions: z.number().int(),
});

export const addCounsellorPerformanceSchema = z.object({
  counsellorId: z.string(),
  counsellorName: z.string(),
  period: z.string(),
  leadsHandled: z.number().int(),
  conversions: z.number().int(),
  revenue: z.number(),
});

export const upsertPayrollDeductionSchema = z.object({
  employeeId: z.string(),
  month: z.number().int(),
  year: z.number().int(),
  leaveDays: z.number().int().default(0),
  leaveDeduction: z.number().default(0),
  taxAmount: z.number().default(0),
  otherDeductions: z.number().default(0),
});
