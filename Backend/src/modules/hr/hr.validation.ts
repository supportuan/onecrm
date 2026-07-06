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

export const createLeaveRequestSchema = z.object({
  leaveTypeName: z.string().min(1),
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
  days: z.number().positive(),
  reason: z.string().optional(),
});

export const processLeaveRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewerNote: z.string().optional(),
});

// Accepts both snake_case (legacy) and camelCase (current frontend) field
// names so the LeaveManagement form's annualQuota / yearEndPolicy / etc.
// values stop being silently ignored.
export const createLeaveDefinitionSchema = z
  .object({
    leaveTypeId: z.string(),
    annual_quota: z.number().optional(),
    annualQuota: z.number().optional(),
    carry_forward: z.boolean().optional(),
    yearEndPolicy: z.string().optional(),
    isUnlimited: z.boolean().optional(),
    accrualType: z.string().optional(),
    accrualRate: z.number().optional(),
    carryForwardMax: z.number().optional(),
    minDays: z.number().optional(),
    maxDays: z.number().optional(),
    gender: z.string().optional(),
  })
  .transform((d) => {
    const accrualType = d.accrualType ?? 'yearly';
    const accrualRate = d.accrualRate ?? 0;
    let annual_quota = d.annualQuota ?? d.annual_quota;
    if (annual_quota == null || Number.isNaN(annual_quota)) {
      if (accrualType === 'monthly' && accrualRate > 0) annual_quota = Math.round(accrualRate * 12);
      else if (accrualType === 'quarterly' && accrualRate > 0) annual_quota = Math.round(accrualRate * 4);
      else annual_quota = 12;
    }
    return {
      leaveTypeId: d.leaveTypeId,
      annual_quota,
      carry_forward: d.carry_forward ?? d.yearEndPolicy === 'carry_forward',
      accrual_type: accrualType,
      accrual_rate: accrualRate,
    };
  });

export const assignLeaveEmployeesSchema = z.object({
  employeeIds: z.array(z.string()),
});

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1).max(80),
  code: z.string().min(1).max(20).regex(/^[A-Za-z0-9_-]+$/),
});

export const updateLeaveTypeSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  code: z.string().min(1).max(20).regex(/^[A-Za-z0-9_-]+$/).optional(),
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
  templateId: z.string().optional(),
});

export const updateOnboardingItemSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED']),
  completedBy: z.string().optional(),
  attachmentUrl: z.string().optional().nullable(),
  attachmentFileName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createOfferLetterSchema = z.object({
  candidateId: z.string().min(1),
  candidateName: z.string(),
  candidateEmail: z.string().email(),
  jobTitle: z.string(),
  department: z.string(),
  offeredSalary: z.number(),
  joiningDate: z.string(),
  expiryDate: z.string(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).default('DRAFT'),
  policyTemplate: z.string().default('standard'),
  templateId: z.string().optional(),
  conditional: z.boolean().optional(),
});

export const createOfferLetterTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  bodyHtml: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export const updateOfferLetterTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  bodyHtml: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
});

export const updateOfferLetterStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
});

export const acceptOfferLetterSchema = z.object({
  onboardingTemplateId: z.string().optional(),
});

export const rejectOfferLetterSchema = z.object({
  notes: z.string().optional(),
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

export const rescheduleInterviewSchema = z.object({
  scheduledAt: z.string(),
  meetingLink: z.string().optional(),
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

export const updateJobPostingSchema = z.object({
  title: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  salaryRange: z.string().optional(),
  hiringManager: z.string().optional(),
  closingDate: z.string().optional().nullable(),
});

export const updateCandidateSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  resumeUrl: z.string().optional().nullable(),
});

export const updateCandidateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED', 'HIRED', 'WITHDRAWN']),
  notes: z.string().optional(),
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
  notes: z.string().optional(),
});

export const createOnboardingTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  role: z.string().optional(),
  isDefault: z.boolean().optional(),
  items: z.array(
    z.object({
      category: z.enum(['DOCUMENTS', 'ACCESS', 'TRAINING']),
      title: z.string().min(1),
      description: z.string().optional(),
      dueOffsetDays: z.number().int().optional(),
      assigneeRole: z.string().optional(),
      sortOrder: z.number().int().optional(),
    }),
  ),
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

export const createPerformanceReviewSchema = z.object({
  name: z.string().min(1),
  employeeId: z.string().min(1),
  department: z.string().min(1),
  cycle: z.string().min(1),
  manager: z.string().min(1),
  status: z.string().optional(),
  rating: z.number().optional(),
  date: z.string().optional(),
});

export const updatePerformanceReviewSchema = z.object({
  rating: z.number().optional(),
  status: z.string().optional(),
  manager: z.string().optional(),
  cycle: z.string().optional(),
  department: z.string().optional(),
  date: z.string().optional(),
});

export const performancePeriodSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM'),
  cycle: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  biometricId: z.string().optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  access_role: z.enum(['EMPLOYEE', 'COUNSELLOR', 'SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN']).optional(),
  employmentStatus: z.enum(['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED']).optional(),
  resignedAt: z.string().optional().nullable(),
  terminatedAt: z.string().optional().nullable(),
  exitReason: z.string().optional().nullable(),
});

export const createEmployeeDocumentSchema = z.object({
  type: z.enum(['OFFER_LETTER', 'ID_PROOF', 'CONTRACT', 'OTHER']),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  mimeType: z.string().optional().nullable(),
  fileSize: z.number().int().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
