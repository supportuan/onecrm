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
