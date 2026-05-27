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

export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  access_role: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().optional().nullable(),
  location: z.string().optional(),
  employmentStatus: z.enum(['Active', 'On Leave', 'Resigned', 'Terminated']).optional(),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().optional().nullable(),
  location: z.string().optional(),
  employmentStatus: z.enum(['Active', 'On Leave', 'Resigned', 'Terminated']).optional(),
  dob: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  hireDate: z.string().optional(),
  access_role: z.string().optional(),
});

export const uploadDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  type: z.string().min(1, 'Document type is required'),
  size: z.string().optional(),
});

export const remoteClockInSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  ip: z.string().optional(),
  coordinates: z.string().optional(),
  isCheckOut: z.boolean().optional(),
});

export const applyLeaveRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  leaveTypeId: z.string().min(1, 'Leave type ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(1, 'Reason is required'),
});

export const processLeaveApprovalSchema = z.object({
  role: z.enum(['MANAGER', 'HR']),
  status: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().optional(),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

export const createBusinessGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  description: z.string().optional(),
  targetMetric: z.string().optional(),
});

export const linkBusinessGoalSchema = z.object({
  goalId: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid goal ID format'),
});

export const createKpiSchema = z.object({
  name: z.string().min(1, 'KPI name is required'),
  description: z.string().optional(),
  metric: z.string().min(1, 'Metric is required'),
  roleCategory: z.enum(['counsellor', 'marketing', 'processing', 'general']).optional(),
});

export const createPerformanceReviewSchema = z.object({
  name: z.string().min(1, 'Employee name is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  department: z.string().optional(),
  cycle: z.string().optional(),
  manager: z.string().optional(),
  status: z.string().optional(),
});

export const updatePerformanceReviewSchema = z.object({
  rating: z.number().min(0).max(5).optional(),
  status: z.string().optional(),
  kpiScores: z.object({
    kpi1: z.number(),
    kpi2: z.number(),
    kpi3: z.number(),
    feedback: z.string().optional(),
  }).optional(),
});
