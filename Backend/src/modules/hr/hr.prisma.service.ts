import { prisma } from '../../prisma.js';
import type {
  Employee,
  Device,
  NetworkWhitelist,
  AttendanceRecord,
  Regularization,
  LeavePlan,
  LeaveType,
  LeaveDefinition,
  Holiday,
  SalaryStructure,
  Payslip,
  OnboardingChecklist,
  OnboardingItem,
  OfferLetter,
  Interview,
  InterviewFeedback,
  JobPosting,
  Candidate,
  ProcessingMetric,
  KPIDefinition,
  KPIMetric,
  MarketingPerformance,
  CounsellorPerformance,
  PayrollDeduction,
  PerformanceReview,
} from './hr.service.js';
import type {
  HrEmployee,
  HrAttendanceRecord,
  HrAttendanceDevice,
  HrNetworkWhitelist,
  HrRegularization,
  HrLeavePlan,
  HrLeaveType,
  HrLeaveDefinition,
  HrHoliday,
  HrSalaryStructure,
  HrPayslip,
  HrOnboardingChecklist,
  HrOnboardingItem,
  HrOfferLetter,
  HrInterview,
  HrJobPosting,
  HrCandidate,
  HrProcessingMetric,
  HrKpiDefinition,
  HrKpiMetric,
  HrMarketingPerformance,
  HrCounsellorPerformance,
  HrPayrollDeduction,
  HrPerformanceReview,
  HrReviewStatus,
  HrAttendanceStatus,
  HrAccessRole,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const sid = (id: number) => String(id);

export const resolveEmployeeId = async (id: string): Promise<HrEmployee | null> => {
  const numericId = parseInt(id, 10);
  return prisma.hrEmployee.findFirst({
    where: {
      OR: [
        ...(!Number.isNaN(numericId) ? [{ id: numericId }] : []),
        { employeeCode: id },
        { email: id },
      ],
    },
  });
};

const mapEmployee = (e: HrEmployee): Employee => ({
  id: sid(e.id),
  name: e.name,
  employeeId: e.employeeCode,
  email: e.email,
  access_role: e.accessRole,
  department: e.department,
  designation: e.designation,
  phone: e.phone,
  biometricId: e.biometricId,
  location: e.location,
});

const mapDevice = (d: HrAttendanceDevice): Device => ({
  id: sid(d.id),
  deviceId: d.deviceId,
  deviceName: d.deviceName,
  deviceIp: d.deviceIp,
  status: d.status,
  lastSync: d.lastSync.toISOString(),
  settings: (d.settings as Record<string, unknown>) ?? {},
});

const mapNetwork = (n: HrNetworkWhitelist): NetworkWhitelist => ({
  id: sid(n.id),
  ip_address_or_range: n.ipAddressOrRange,
  label: n.label,
  is_active: n.isActive,
});

const mapAttendanceRecord = (r: HrAttendanceRecord): AttendanceRecord => ({
  id: sid(r.id),
  employee_id: sid(r.employeeId),
  date: r.date,
  check_in: r.checkIn?.toISOString() ?? null,
  check_out: r.checkOut?.toISOString() ?? null,
  status: r.status as AttendanceRecord['status'],
  device_id: r.deviceRef,
});

const mapRegularization = (r: HrRegularization): Regularization => ({
  id: sid(r.id),
  employee_id: sid(r.employeeId),
  name: r.name,
  date: r.date,
  type: r.type,
  time: r.time,
  reason: r.reason,
  status: r.status,
  approverRemarks: r.approverRemarks ?? undefined,
  createdAt: r.createdAt.toISOString(),
});

const mapLeavePlan = (p: HrLeavePlan): LeavePlan => ({
  id: sid(p.id),
  name: p.name,
  description: p.description ?? undefined,
});

const mapLeaveType = (t: HrLeaveType): LeaveType => ({
  id: sid(t.id),
  name: t.name,
  code: t.code,
});

const mapLeaveDefinition = (d: HrLeaveDefinition): LeaveDefinition => ({
  plan_id: sid(d.planId),
  leave_type_id: sid(d.leaveTypeId),
  name: d.name,
  annual_quota: d.annualQuota,
  carry_forward: d.carryForward,
});

const mapHoliday = (h: HrHoliday): Holiday => ({
  id: sid(h.id),
  name: h.name,
  date: h.date,
  is_restricted: h.isRestricted,
});

const mapSalaryStructure = (s: HrSalaryStructure, emp?: HrEmployee | null) => ({
  id: sid(s.id),
  employeeId: sid(s.employeeId),
  basicSalary: s.basicSalary,
  allowances: s.allowances,
  deductions: s.deductions,
  ...(emp ? { name: emp.name, email: emp.email } : {}),
});

const mapPayslip = (p: HrPayslip): Payslip => ({
  id: sid(p.id),
  employeeId: sid(p.employeeId),
  name: p.name,
  month: p.month,
  year: p.year,
  basicSalary: p.basicSalary,
  allowances: p.allowances,
  deductions: p.deductions,
  netSalary: p.netSalary,
  status: p.status,
});

const mapOnboardingItem = (i: HrOnboardingItem): OnboardingItem => ({
  id: sid(i.id),
  category: i.category,
  title: i.title,
  description: i.description ?? undefined,
  status: i.status,
  completedAt: i.completedAt?.toISOString(),
  completedBy: i.completedBy ?? undefined,
});

const mapOnboardingChecklist = (
  c: HrOnboardingChecklist & { items: HrOnboardingItem[] }
): OnboardingChecklist => ({
  id: sid(c.id),
  employeeId: sid(c.employeeId),
  employeeName: c.employeeName,
  startDate: c.startDate,
  status: c.status,
  items: c.items.map(mapOnboardingItem),
  createdAt: c.createdAt.toISOString(),
});

const mapOfferLetter = (o: HrOfferLetter): OfferLetter => ({
  id: sid(o.id),
  candidateId: sid(o.candidateId),
  candidateName: o.candidateName,
  candidateEmail: o.candidateEmail,
  jobTitle: o.jobTitle,
  department: o.department,
  offeredSalary: o.offeredSalary,
  joiningDate: o.joiningDate,
  expiryDate: o.expiryDate,
  status: o.status,
  policyTemplate: o.policyTemplate,
  createdAt: o.createdAt.toISOString(),
  updatedAt: o.updatedAt.toISOString(),
});

const mapInterview = (i: HrInterview): Interview => ({
  id: sid(i.id),
  candidateId: sid(i.candidateId),
  candidateName: i.candidateName,
  jobTitle: i.jobTitle,
  round: i.round,
  type: i.type,
  scheduledAt: i.scheduledAt.toISOString(),
  duration: i.duration,
  interviewers: i.interviewers as string[],
  meetingLink: i.meetingLink ?? undefined,
  status: i.status,
  feedback: i.feedback ? (i.feedback as unknown as InterviewFeedback) : undefined,
  createdAt: i.createdAt.toISOString(),
});

const mapJobPosting = (j: HrJobPosting, applicantsCount?: number): JobPosting => ({
  id: sid(j.id),
  title: j.title,
  department: j.department,
  location: j.location,
  type: j.type,
  description: j.description,
  requirements: j.requirements,
  salaryRange: j.salaryRange,
  status: j.status,
  applicantsCount: applicantsCount ?? 0,
  hiringManager: j.hiringManager,
  postedAt: j.postedAt ?? undefined,
  closingDate: j.closingDate ?? undefined,
  createdAt: j.createdAt.toISOString(),
});

const mapCandidate = (c: HrCandidate): Candidate => ({
  id: sid(c.id),
  jobId: sid(c.jobId),
  name: c.name,
  email: c.email,
  phone: c.phone,
  resumeUrl: c.resumeUrl ?? undefined,
  currentStage: c.currentStage,
  status: c.status,
  appliedAt: c.appliedAt,
});

const mapProcessingMetric = (m: HrProcessingMetric): ProcessingMetric => ({
  id: sid(m.id),
  period: m.period,
  totalApplications: m.totalApplications,
  processedApplications: m.processedApplications,
  accurateApplications: m.accurateApplications,
  avgTurnaroundDays: m.avgTurnaroundDays,
  reviewsCompleted: m.reviewsCompleted,
  pendingReviews: m.pendingReviews,
});

const mapKpiDefinition = (k: HrKpiDefinition): KPIDefinition => ({
  id: sid(k.id),
  role: k.role,
  name: k.name,
  description: k.description ?? undefined,
  target: k.target,
  unit: k.unit,
  frequency: k.frequency,
  isActive: k.isActive,
});

const mapKpiMetric = (m: HrKpiMetric, def?: HrKpiDefinition | null) => ({
  id: sid(m.id),
  kpiId: sid(m.kpiId),
  userId: m.userId ?? undefined,
  userRole: m.userRole,
  period: m.period,
  actualValue: m.actualValue,
  targetValue: m.targetValue,
  notes: m.notes ?? undefined,
  recordedAt: m.recordedAt.toISOString(),
  ...(def ? { kpiName: def.name, unit: def.unit } : {}),
});

const mapMarketingPerformance = (m: HrMarketingPerformance): MarketingPerformance => ({
  id: sid(m.id),
  period: m.period,
  leadsGenerated: m.leadsGenerated,
  costPerLead: m.costPerLead,
  totalBudget: m.totalBudget,
  channel: m.channel,
  conversions: m.conversions,
});

const mapCounsellorPerformance = (c: HrCounsellorPerformance): CounsellorPerformance => ({
  id: sid(c.id),
  counsellorId: c.counsellorId,
  counsellorName: c.counsellorName,
  period: c.period,
  leadsHandled: c.leadsHandled,
  conversions: c.conversions,
  revenue: c.revenue,
  conversionRate: c.conversionRate,
});

const mapPayrollDeduction = (d: HrPayrollDeduction, emp?: HrEmployee | null) => ({
  id: sid(d.id),
  employeeId: sid(d.employeeId),
  month: d.month,
  year: d.year,
  leaveDays: d.leaveDays,
  leaveDeduction: d.leaveDeduction,
  taxAmount: d.taxAmount,
  otherDeductions: d.otherDeductions,
  totalDeductions: d.totalDeductions,
  ...(emp ? { employeeName: emp.name } : {}),
});

const resolveNumericId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
};

// ---------------------------------------------------------------------------
// 1. Employees & Admin Roles
// ---------------------------------------------------------------------------

export const getEmployees = async () => {
  const rows = await prisma.hrEmployee.findMany({ orderBy: { id: 'asc' } });
  return rows.map(mapEmployee);
};

export const getTeam = async () => getEmployees();

export const assignAccessRole = async (employeeId: string, role: string) => {
  const emp = await resolveEmployeeId(employeeId);
  if (!emp) throw new Error('Employee not found');
  const updated = await prisma.hrEmployee.update({
    where: { id: emp.id },
    data: { accessRole: role as HrAccessRole },
  });
  return mapEmployee(updated);
};

export const bulkImportEmployees = async (rows: Partial<Employee>[]) => {
  let importedCount = 0;
  for (const row of rows) {
    if (!row.name || !row.email || !row.employeeId) continue;
    const exists = await prisma.hrEmployee.findFirst({
      where: {
        OR: [
          { email: { equals: row.email, mode: 'insensitive' } },
          { employeeCode: row.employeeId },
        ],
      },
    });
    if (!exists) {
      await prisma.hrEmployee.create({
        data: {
          name: row.name,
          employeeCode: row.employeeId,
          email: row.email,
          accessRole: (row.access_role as HrAccessRole) || 'EMPLOYEE',
          department: row.department || 'Operations',
          designation: row.designation || 'Staff Member',
          phone: row.phone || null,
          biometricId: row.biometricId || row.employeeId,
          location: row.location || 'HQ Office',
        },
      });
      importedCount++;
    }
  }
  return { success: true, count: importedCount };
};

// ---------------------------------------------------------------------------
// 2. Attendance Settings
// ---------------------------------------------------------------------------

// HrAttendanceSetting is per-tenant since Priority A. The PK is tenantId.
// Callers must pass req.tenantId; the controller does that.
export const getAttendanceSettings = async (tenantId: number) => {
  const settings = await prisma.hrAttendanceSetting.upsert({
    where: { tenantId },
    create: { tenantId, attendanceMode: 'biometric', enableIpValidation: true },
    update: {},
  });
  return {
    attendance_mode: settings.attendanceMode,
    enable_ip_validation: settings.enableIpValidation,
  };
};

export const updateAttendanceSettings = async (
  tenantId: number,
  data: { attendance_mode?: string; enable_ip_validation?: boolean },
) => {
  const settings = await prisma.hrAttendanceSetting.upsert({
    where: { tenantId },
    create: {
      tenantId,
      attendanceMode: data.attendance_mode ?? 'biometric',
      enableIpValidation: data.enable_ip_validation ?? true,
    },
    update: {
      ...(data.attendance_mode !== undefined && { attendanceMode: data.attendance_mode }),
      ...(data.enable_ip_validation !== undefined && { enableIpValidation: data.enable_ip_validation }),
    },
  });
  return {
    attendance_mode: settings.attendanceMode,
    enable_ip_validation: settings.enableIpValidation,
  };
};

// ---------------------------------------------------------------------------
// 3. Device Whitelists
// ---------------------------------------------------------------------------

export const getDevices = async () => {
  const rows = await prisma.hrAttendanceDevice.findMany({ orderBy: { id: 'asc' } });
  return rows.map(mapDevice);
};

export const createDevice = async (device: Record<string, string>) => {
  const newDevice = await prisma.hrAttendanceDevice.create({
    data: {
      deviceId: device.device_id || device.deviceId || device.device_ip || device.deviceIp || '',
      deviceName: device.device_name || device.deviceName || '',
      deviceIp: device.device_ip || device.deviceIp || '',
      status: 'online',
      lastSync: new Date(),
      settings: {},
    },
  });
  return mapDevice(newDevice);
};

export const deleteDevice = async (id: string) => {
  const numericId = resolveNumericId(id);
  await prisma.hrAttendanceDevice.deleteMany({
    where: {
      OR: [
        ...(numericId !== null ? [{ id: numericId }] : []),
        { deviceId: id },
        { deviceIp: id },
      ],
    },
  });
  return { success: true };
};

// ---------------------------------------------------------------------------
// 4. IP Networks Whitelist
// ---------------------------------------------------------------------------

export const getNetworks = async () => {
  const rows = await prisma.hrNetworkWhitelist.findMany({ orderBy: { id: 'asc' } });
  return rows.map(mapNetwork);
};

export const createNetwork = async (net: Omit<NetworkWhitelist, 'id'>) => {
  const newNet = await prisma.hrNetworkWhitelist.create({
    data: {
      ipAddressOrRange: net.ip_address_or_range,
      label: net.label,
      isActive: net.is_active !== undefined ? net.is_active : true,
    },
  });
  return mapNetwork(newNet);
};

export const deleteNetwork = async (id: string) => {
  const numericId = resolveNumericId(id);
  if (numericId !== null) {
    await prisma.hrNetworkWhitelist.deleteMany({ where: { id: numericId } });
  }
  return { success: true };
};

// ---------------------------------------------------------------------------
// 5. Biometric Users
// ---------------------------------------------------------------------------

export const getBiometricUsers = async (_ip: string) => {
  const employees = await prisma.hrEmployee.findMany({ orderBy: { id: 'asc' } });
  return employees.map((e) => ({
    emp_id: e.employeeCode,
    name: e.name,
    enrolled: !!e.biometricId,
    lastMatch: e.biometricId ? new Date().toISOString() : null,
  }));
};

// ---------------------------------------------------------------------------
// 6. Attendance Events / Log Processor
// ---------------------------------------------------------------------------

export const getAttendanceEvents = async () => {
  const records = await prisma.hrAttendanceRecord.findMany({
    include: { employee: true },
    orderBy: { id: 'asc' },
  });
  return records.map((r) => ({
    ...mapAttendanceRecord(r),
    employeeName: r.employee.name,
    employeeId: r.employee.employeeCode,
  }));
};

export const processBiometricLogs = async () => {
  const employees = await prisma.hrEmployee.findMany({ orderBy: { id: 'asc' } });
  const devices = await prisma.hrAttendanceDevice.findMany({ orderBy: { id: 'asc' } });
  const device1 = devices[0];
  const device2 = devices[1] ?? devices[0];
  const emp1 = employees[0];
  const emp4 = employees[3] ?? employees[0];

  const logsToProcess = [
    { employee_id: emp1.id, time: new Date().toISOString(), type: 'check-in', device: device1 },
    { employee_id: emp4.id, time: new Date().toISOString(), type: 'check-in', device: device2 },
  ];

  for (const log of logsToProcess) {
    const dateStr = log.time.split('T')[0];
    const hours = new Date(log.time).getHours();
    const status: HrAttendanceStatus = hours >= 9 ? 'LATE' : 'PRESENT';

    const existing = await prisma.hrAttendanceRecord.findFirst({
      where: { employeeId: log.employee_id, date: dateStr },
    });

    if (!existing) {
      await prisma.hrAttendanceRecord.create({
        data: {
          employeeId: log.employee_id,
          date: dateStr,
          checkIn: new Date(log.time),
          status,
          deviceRef: sid(log.device.id),
          deviceDbId: log.device.id,
        },
      });
    }
  }
  return { success: true, processed: logsToProcess.length };
};

export const submitRemoteClockIn = async (
  employeeId: string,
  data: { ip: string; coordinates?: string; isCheckOut?: boolean }
) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  const emp = await resolveEmployeeId(employeeId);
  if (!emp) {
    throw new Error('Employee profile not found. Ask HR to link your account to the employee directory.');
  }

  const existing = await prisma.hrAttendanceRecord.findFirst({
    where: { employeeId: emp.id, date: dateStr },
  });

  if (data.isCheckOut) {
    if (!existing?.checkIn) {
      throw new Error('Clock in before you can clock out.');
    }
    if (existing.checkOut) {
      throw new Error('You have already clocked out today.');
    }
    const updated = await prisma.hrAttendanceRecord.update({
      where: { id: existing.id },
      data: { checkOut: now },
    });
    return mapAttendanceRecord(updated);
  }

  if (existing?.checkIn && !existing.checkOut) {
    throw new Error('You are already clocked in.');
  }
  if (existing?.checkOut) {
    throw new Error('Today\'s attendance is already complete.');
  }

  const status: HrAttendanceStatus = now.getHours() >= 9 ? 'LATE' : 'PRESENT';

  if (existing) {
    const updated = await prisma.hrAttendanceRecord.update({
      where: { id: existing.id },
      data: { checkIn: now, checkOut: null, status, deviceRef: 'remote_clockin' },
    });
    return mapAttendanceRecord(updated);
  }

  const newRecord = await prisma.hrAttendanceRecord.create({
    data: {
      employeeId: emp.id,
      date: dateStr,
      checkIn: now,
      status,
      deviceRef: 'remote_clockin',
    },
  });
  return mapAttendanceRecord(newRecord);
};

export const getMyAttendance = async (
  userEmail: string,
  month?: number,
  year?: number
) => {
  const employee = await prisma.hrEmployee.findFirst({ where: { email: userEmail } });

  const m = month ?? new Date().getMonth() + 1;
  const y = year ?? new Date().getFullYear();
  const todayStr = new Date().toISOString().split('T')[0];
  const monthPrefix = `${y}-${String(m).padStart(2, '0')}`;

  if (!employee) {
    return {
      employee: null,
      today: null,
      clockState: 'not_clocked_in' as const,
      records: [],
      summary: { present: 0, late: 0, absent: 0, halfDay: 0, totalDays: 0 },
    };
  }

  const [todayRecord, monthRecords] = await Promise.all([
    prisma.hrAttendanceRecord.findFirst({
      where: { employeeId: employee.id, date: todayStr },
    }),
    prisma.hrAttendanceRecord.findMany({
      where: { employeeId: employee.id, date: { startsWith: monthPrefix } },
      orderBy: { date: 'desc' },
    }),
  ]);

  const summary = { present: 0, late: 0, absent: 0, halfDay: 0, totalDays: monthRecords.length };
  for (const r of monthRecords) {
    if (r.status === 'PRESENT') summary.present += 1;
    else if (r.status === 'LATE') summary.late += 1;
    else if (r.status === 'ABSENT') summary.absent += 1;
    else if (r.status === 'HALF_DAY') summary.halfDay += 1;
  }

  let clockState: 'not_clocked_in' | 'clocked_in' | 'clocked_out' = 'not_clocked_in';
  if (todayRecord?.checkOut) clockState = 'clocked_out';
  else if (todayRecord?.checkIn) clockState = 'clocked_in';

  return {
    employee: mapEmployee(employee),
    today: todayRecord
      ? {
          date: todayRecord.date,
          checkIn: todayRecord.checkIn?.toISOString() ?? null,
          checkOut: todayRecord.checkOut?.toISOString() ?? null,
          status: todayRecord.status,
        }
      : null,
    clockState,
    records: monthRecords.map(mapAttendanceRecord),
    summary,
  };
};

// ---------------------------------------------------------------------------
// 7. Team Calendar
// ---------------------------------------------------------------------------

export const getTeamCalendar = async (_month: number, _year: number) => {
  const employees = await prisma.hrEmployee.findMany({
    include: { attendanceRecords: true },
    orderBy: { id: 'asc' },
  });
  return employees.map((emp) => ({
    employeeId: emp.employeeCode,
    name: emp.name,
    department: emp.department,
    records: emp.attendanceRecords.map((r) => ({
      date: r.date,
      check_in: r.checkIn?.toISOString() ?? null,
      check_out: r.checkOut?.toISOString() ?? null,
      status: r.status,
    })),
  }));
};

// ---------------------------------------------------------------------------
// 8. Regularizations
// ---------------------------------------------------------------------------

export const getRegularizations = async () => {
  const rows = await prisma.hrRegularization.findMany({ orderBy: { id: 'asc' } });
  return rows.map(mapRegularization);
};

export const requestRegularization = async (employeeId: string, data: {
  date: string;
  type: string;
  time: string;
  reason: string;
}) => {
  let emp = await resolveEmployeeId(employeeId);
  if (!emp) {
    emp = await prisma.hrEmployee.findFirst({ orderBy: { id: 'asc' } });
  }
  if (!emp) throw new Error('Employee not found');

  const newReg = await prisma.hrRegularization.create({
    data: {
      employeeId: emp.id,
      name: emp.name,
      date: data.date,
      type: data.type,
      time: data.time,
      reason: data.reason,
      status: 'PENDING',
    },
  });

  const { notifyRoles } = await import('../notifications/recipients.js');
  const { UserRole } = await import('@prisma/client');
  await notifyRoles([UserRole.GLOBAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.HR], 'hr.regularization_request', {
    employeeName: emp.name,
    date: data.date,
    type: data.type,
  });

  return mapRegularization(newReg);
};

export const processRegularization = async (
  id: string,
  status: 'APPROVED' | 'REJECTED',
  remarks?: string
) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Regularization request not found');

  // findFirst is auto-scoped to the active tenant.
  const reg = await prisma.hrRegularization.findFirst({ where: { id: numericId } });
  if (!reg) throw new Error('Regularization request not found');

  const updated = await prisma.hrRegularization.update({
    where: { id: numericId },
    data: {
      status,
      approverRemarks: remarks || 'Processed by Administrator',
    },
  });

  if (status === 'APPROVED') {
    const dateStr = reg.date;
    const hours = parseInt(reg.time.split(':')[0], 10);
    const statusAtt: HrAttendanceStatus = hours >= 9 ? 'LATE' : 'PRESENT';

    const existing = await prisma.hrAttendanceRecord.findFirst({
      where: { employeeId: reg.employeeId, date: dateStr },
    });

    if (existing) {
      await prisma.hrAttendanceRecord.update({
        where: { id: existing.id },
        data:
          reg.type === 'check-in'
            ? { checkIn: new Date(`${dateStr}T${reg.time}:00.000Z`) }
            : { checkOut: new Date(`${dateStr}T${reg.time}:00.000Z`) },
      });
    } else {
      await prisma.hrAttendanceRecord.create({
        data: {
          employeeId: reg.employeeId,
          date: dateStr,
          checkIn: reg.type === 'check-in' ? new Date(`${dateStr}T${reg.time}:00.000Z`) : null,
          checkOut: reg.type === 'check-out' ? new Date(`${dateStr}T${reg.time}:00.000Z`) : null,
          status: statusAtt,
          deviceRef: 'regularized',
        },
      });
    }
  }

  return mapRegularization(updated);
};

// ---------------------------------------------------------------------------
// 9. Leave Management
// ---------------------------------------------------------------------------

export const getLeavePlans = async () => {
  const rows = await prisma.hrLeavePlan.findMany({ orderBy: { id: 'asc' } });
  return rows.map(mapLeavePlan);
};

export const createLeavePlan = async (plan: { name: string; description?: string }) => {
  const newPlan = await prisma.hrLeavePlan.create({
    data: { name: plan.name, description: plan.description },
  });
  return mapLeavePlan(newPlan);
};

export const getLeaveTypes = async () => {
  const rows = await prisma.hrLeaveType.findMany({ orderBy: { id: 'asc' } });
  return rows.map(mapLeaveType);
};

export const getLeaveDefinitions = async (planId: string) => {
  const numericPlanId = resolveNumericId(planId);
  if (numericPlanId === null) return [];
  const rows = await prisma.hrLeaveDefinition.findMany({
    where: { planId: numericPlanId },
    orderBy: { id: 'asc' },
  });
  return rows.map(mapLeaveDefinition);
};

export const addLeaveDefinition = async (
  planId: string,
  data: { leaveTypeId: string; annual_quota: number; carry_forward?: boolean }
) => {
  const numericPlanId = resolveNumericId(planId);
  if (numericPlanId === null) throw new Error('Leave plan not found');

  const lt = await prisma.hrLeaveType.findFirst({
    where: {
      OR: [
        ...(resolveNumericId(data.leaveTypeId) !== null
          ? [{ id: resolveNumericId(data.leaveTypeId)! }]
          : []),
        { name: data.leaveTypeId },
      ],
    },
  });
  if (!lt) throw new Error('Leave type not found');

  const def = await prisma.hrLeaveDefinition.upsert({
    where: { planId_leaveTypeId: { planId: numericPlanId, leaveTypeId: lt.id } },
    create: {
      planId: numericPlanId,
      leaveTypeId: lt.id,
      name: lt.name,
      annualQuota: data.annual_quota || 10,
      carryForward: data.carry_forward || false,
    },
    update: {
      name: lt.name,
      annualQuota: data.annual_quota || 10,
      carryForward: data.carry_forward || false,
    },
  });
  return mapLeaveDefinition(def);
};

export const deleteLeaveDefinition = async (planId: string, leaveTypeId: string) => {
  const numericPlanId = resolveNumericId(planId);
  const numericLeaveTypeId = resolveNumericId(leaveTypeId);
  if (numericPlanId !== null && numericLeaveTypeId !== null) {
    await prisma.hrLeaveDefinition.deleteMany({
      where: { planId: numericPlanId, leaveTypeId: numericLeaveTypeId },
    });
  }
  return { success: true };
};

export const getLeavePlanEmployees = async (planId: string) => {
  const numericPlanId = resolveNumericId(planId);
  if (numericPlanId === null) return [];
  const assignments = await prisma.hrLeavePlanAssignment.findMany({
    where: { planId: numericPlanId },
    include: { employee: true },
  });
  return assignments.map((a) => mapEmployee(a.employee));
};

export const assignLeavePlanEmployees = async (planId: string, employeeIds: string[]) => {
  const numericPlanId = resolveNumericId(planId);
  if (numericPlanId === null) throw new Error('Leave plan not found');

  const resolvedIds: number[] = [];
  for (const empId of employeeIds) {
    const emp = await resolveEmployeeId(empId);
    if (emp) resolvedIds.push(emp.id);
  }

  await prisma.hrLeavePlanAssignment.deleteMany({
    where: { employeeId: { in: resolvedIds } },
  });

  for (const empDbId of resolvedIds) {
    await prisma.hrLeavePlanAssignment.upsert({
      where: { planId_employeeId: { planId: numericPlanId, employeeId: empDbId } },
      create: { planId: numericPlanId, employeeId: empDbId },
      update: {},
    });
  }
  return { success: true };
};

// ---------------------------------------------------------------------------
// 10. Holidays
// ---------------------------------------------------------------------------

export const getHolidays = async () => {
  const rows = await prisma.hrHoliday.findMany({ orderBy: { date: 'asc' } });
  return rows.map(mapHoliday);
};

export const createHoliday = async (hol: Omit<Holiday, 'id'>) => {
  const newHol = await prisma.hrHoliday.create({
    data: {
      name: hol.name,
      date: hol.date,
      isRestricted: hol.is_restricted || false,
    },
  });
  return mapHoliday(newHol);
};

export const deleteHoliday = async (id: string) => {
  const numericId = resolveNumericId(id);
  await prisma.hrHoliday.deleteMany({
    where: {
      OR: [
        ...(numericId !== null ? [{ id: numericId }] : []),
        { name: id },
        { date: id },
      ],
    },
  });
  return { success: true };
};

// ---------------------------------------------------------------------------
// 11. Salary & Payroll
// ---------------------------------------------------------------------------

export const getSalaryStructures = async () => {
  const rows = await prisma.hrSalaryStructure.findMany({
    include: { employee: true },
    orderBy: { id: 'asc' },
  });
  return rows.map((s) => mapSalaryStructure(s, s.employee));
};

export const updateSalaryStructure = async (data: Omit<SalaryStructure, 'id'>) => {
  const emp = await resolveEmployeeId(data.employeeId);
  if (!emp) throw new Error('Employee not found');

  const struct = await prisma.hrSalaryStructure.upsert({
    where: { employeeId: emp.id },
    create: {
      employeeId: emp.id,
      basicSalary: Number(data.basicSalary),
      allowances: Number(data.allowances),
      deductions: Number(data.deductions),
    },
    update: {
      basicSalary: Number(data.basicSalary),
      allowances: Number(data.allowances),
      deductions: Number(data.deductions),
    },
  });
  return {
    id: sid(struct.id),
    employeeId: sid(struct.employeeId),
    basicSalary: struct.basicSalary,
    allowances: struct.allowances,
    deductions: struct.deductions,
  };
};

export const getPayslips = async () => {
  const rows = await prisma.hrPayslip.findMany({ orderBy: { id: 'asc' } });
  return rows.map(mapPayslip);
};

export const calculatePayroll = async (month: number, year: number) => {
  const structures = await prisma.hrSalaryStructure.findMany({
    include: { employee: true },
  });
  const computedList: Payslip[] = [];

  for (const struct of structures) {
    const exists = await prisma.hrPayslip.findUnique({
      where: {
        employeeId_month_year: {
          employeeId: struct.employeeId,
          month,
          year,
        },
      },
    });
    if (exists) continue;

    const deduction = await prisma.hrPayrollDeduction.findUnique({
      where: {
        employeeId_month_year: {
          employeeId: struct.employeeId,
          month,
          year,
        },
      },
    });

    const totalDeductions =
      struct.deductions +
      (deduction?.leaveDeduction ?? 0) +
      (deduction?.taxAmount ?? 0) +
      (deduction?.otherDeductions ?? 0);
    const netSalary = struct.basicSalary + struct.allowances - totalDeductions;

    const newPay = await prisma.hrPayslip.create({
      data: {
        employeeId: struct.employeeId,
        name: struct.employee.name,
        month,
        year,
        basicSalary: struct.basicSalary,
        allowances: struct.allowances,
        deductions: totalDeductions,
        netSalary,
        status: 'PAID',
      },
    });
    computedList.push(mapPayslip(newPay));
  }

  return computedList;
};

// ---------------------------------------------------------------------------
// 12. Onboarding
// ---------------------------------------------------------------------------

export const getOnboardingChecklists = async () => {
  const rows = await prisma.hrOnboardingChecklist.findMany({
    include: { items: { orderBy: { id: 'asc' } } },
    orderBy: { id: 'asc' },
  });
  return rows.map(mapOnboardingChecklist);
};

export const getOnboardingChecklist = async (id: string) => {
  const numericId = resolveNumericId(id);
  const checklist = await prisma.hrOnboardingChecklist.findFirst({
    where: {
      OR: [
        ...(numericId !== null ? [{ id: numericId }] : []),
        ...(numericId !== null ? [{ employeeId: numericId }] : []),
      ],
    },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  if (!checklist) throw new Error('Checklist not found');
  return mapOnboardingChecklist(checklist);
};

const defaultOnboardingItems = (): Array<{
  category: 'DOCUMENTS' | 'ACCESS' | 'TRAINING';
  title: string;
}> => [
  { category: 'DOCUMENTS', title: 'Offer Letter Signed' },
  { category: 'DOCUMENTS', title: 'ID Proof Submitted' },
  { category: 'DOCUMENTS', title: 'Bank Details Form' },
  { category: 'DOCUMENTS', title: 'Educational Certificates' },
  { category: 'ACCESS', title: 'Email Account Created' },
  { category: 'ACCESS', title: 'HRMS Access Granted' },
  { category: 'ACCESS', title: 'System Access Configured' },
  { category: 'TRAINING', title: 'Orientation Session' },
  { category: 'TRAINING', title: 'Compliance Training' },
  { category: 'TRAINING', title: 'Role-specific Training' },
];

export const createOnboardingChecklist = async (data: {
  employeeId: string;
  employeeName: string;
  startDate: string;
}) => {
  const emp = await resolveEmployeeId(data.employeeId);
  const employeeDbId = emp?.id ?? resolveNumericId(data.employeeId);

  const checklist = await prisma.hrOnboardingChecklist.create({
    data: {
      employeeId: employeeDbId ?? 1,
      employeeName: data.employeeName,
      startDate: data.startDate,
      status: 'PENDING',
      items: {
        create: defaultOnboardingItems().map((item) => ({
          category: item.category,
          title: item.title,
          status: 'PENDING',
        })),
      },
    },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  return mapOnboardingChecklist(checklist);
};

export const updateOnboardingItem = async (
  checklistId: string,
  itemId: string,
  data: { status: 'PENDING' | 'COMPLETED'; completedBy?: string }
) => {
  const numericChecklistId = resolveNumericId(checklistId);
  const numericItemId = resolveNumericId(itemId);
  if (numericChecklistId === null || numericItemId === null) {
    throw new Error('Checklist not found');
  }

  const item = await prisma.hrOnboardingItem.findFirst({
    where: { id: numericItemId, checklistId: numericChecklistId },
  });
  if (!item) throw new Error('Item not found');

  await prisma.hrOnboardingItem.update({
    where: { id: numericItemId },
    data: {
      status: data.status,
      completedAt: data.status === 'COMPLETED' ? new Date() : null,
      completedBy: data.status === 'COMPLETED' ? data.completedBy || 'HR Manager' : null,
    },
  });

  const checklist = await prisma.hrOnboardingChecklist.findUnique({
    where: { id: numericChecklistId },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  if (!checklist) throw new Error('Checklist not found');

  const allDone = checklist.items.every((i) => i.status === 'COMPLETED');
  const anyDone = checklist.items.some((i) => i.status === 'COMPLETED');
  const newStatus = allDone ? 'COMPLETED' : anyDone ? 'IN_PROGRESS' : 'PENDING';

  const updated = await prisma.hrOnboardingChecklist.update({
    where: { id: numericChecklistId },
    data: { status: newStatus },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  return mapOnboardingChecklist(updated);
};

// ---------------------------------------------------------------------------
// 13. Offer Letters
// ---------------------------------------------------------------------------

export const getOfferLetters = async () => {
  const rows = await prisma.hrOfferLetter.findMany({ orderBy: { id: 'asc' } });
  return rows.map(mapOfferLetter);
};

export const createOfferLetter = async (data: Omit<OfferLetter, 'id' | 'createdAt' | 'updatedAt'>) => {
  const candidateId = resolveNumericId(data.candidateId);
  const letter = await prisma.hrOfferLetter.create({
    data: {
      candidateId: candidateId ?? 1,
      candidateName: data.candidateName,
      candidateEmail: data.candidateEmail,
      jobTitle: data.jobTitle,
      department: data.department,
      offeredSalary: data.offeredSalary,
      joiningDate: data.joiningDate,
      expiryDate: data.expiryDate,
      status: data.status,
      policyTemplate: data.policyTemplate,
    },
  });
  return mapOfferLetter(letter);
};

export const updateOfferLetterStatus = async (id: string, status: OfferLetter['status']) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Offer letter not found');
  const letter = await prisma.hrOfferLetter.update({
    where: { id: numericId },
    data: { status },
  });
  return mapOfferLetter(letter);
};

// ---------------------------------------------------------------------------
// 14. Interviews
// ---------------------------------------------------------------------------

export const getInterviews = async () => {
  const rows = await prisma.hrInterview.findMany({ orderBy: { id: 'asc' } });
  return rows.map(mapInterview);
};

export const scheduleInterview = async (data: Omit<Interview, 'id' | 'createdAt' | 'feedback'>) => {
  const candidateId = resolveNumericId(data.candidateId);
  const interview = await prisma.hrInterview.create({
    data: {
      candidateId: candidateId ?? 1,
      candidateName: data.candidateName,
      jobTitle: data.jobTitle,
      round: data.round,
      type: data.type,
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration,
      interviewers: data.interviewers,
      meetingLink: data.meetingLink,
      status: data.status,
    },
  });
  return mapInterview(interview);
};

export const updateInterviewStatus = async (id: string, status: Interview['status']) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Interview not found');
  const interview = await prisma.hrInterview.update({
    where: { id: numericId },
    data: { status },
  });
  return mapInterview(interview);
};

export const submitInterviewFeedback = async (id: string, feedback: InterviewFeedback) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Interview not found');
  const interview = await prisma.hrInterview.update({
    where: { id: numericId },
    data: {
      feedback: { ...feedback, submittedAt: new Date().toISOString() },
      status: 'COMPLETED',
    },
  });
  return mapInterview(interview);
};

// ---------------------------------------------------------------------------
// 15. Job Postings & Candidates
// ---------------------------------------------------------------------------

export const getJobPostings = async () => {
  const jobs = await prisma.hrJobPosting.findMany({
    include: { _count: { select: { candidates: true } } },
    orderBy: { id: 'asc' },
  });
  return jobs.map((j) => mapJobPosting(j, j._count.candidates));
};

export const createJobPosting = async (data: Omit<JobPosting, 'id' | 'applicantsCount' | 'createdAt'>) => {
  const posting = await prisma.hrJobPosting.create({
    data: {
      title: data.title,
      department: data.department,
      location: data.location,
      type: data.type,
      description: data.description,
      requirements: data.requirements,
      salaryRange: data.salaryRange,
      status: data.status,
      hiringManager: data.hiringManager,
      postedAt: data.postedAt,
      closingDate: data.closingDate,
    },
  });
  return mapJobPosting(posting, 0);
};

export const updateJobPostingStatus = async (id: string, status: JobPosting['status']) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Job posting not found');
  const posting = await prisma.hrJobPosting.update({
    where: { id: numericId },
    data: { status },
  });
  const count = await prisma.hrCandidate.count({ where: { jobId: numericId } });
  return mapJobPosting(posting, count);
};

export const getCandidates = async (jobId?: string) => {
  const numericJobId = jobId ? resolveNumericId(jobId) : null;
  const rows = await prisma.hrCandidate.findMany({
    where: numericJobId !== null ? { jobId: numericJobId } : undefined,
    orderBy: { id: 'asc' },
  });
  return rows.map(mapCandidate);
};

export const addCandidate = async (data: Omit<Candidate, 'id' | 'appliedAt'>) => {
  const jobId = resolveNumericId(data.jobId);
  const candidate = await prisma.hrCandidate.create({
    data: {
      jobId: jobId ?? 1,
      name: data.name,
      email: data.email,
      phone: data.phone,
      resumeUrl: data.resumeUrl,
      currentStage: data.currentStage,
      status: data.status,
      appliedAt: new Date().toISOString().split('T')[0],
    },
  });
  return mapCandidate(candidate);
};

export const updateCandidateStage = async (
  id: string,
  stage: string,
  status?: Candidate['status']
) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Candidate not found');
  const candidate = await prisma.hrCandidate.update({
    where: { id: numericId },
    data: {
      currentStage: stage,
      ...(status ? { status } : {}),
    },
  });
  return mapCandidate(candidate);
};

// ---------------------------------------------------------------------------
// 16. Processing Metrics
// ---------------------------------------------------------------------------

export const getProcessingMetrics = async () => {
  const rows = await prisma.hrProcessingMetric.findMany({ orderBy: { period: 'desc' } });
  return rows.map(mapProcessingMetric);
};

export const addProcessingMetric = async (
  tenantId: number,
  data: Omit<ProcessingMetric, 'id'>,
) => {
  const metric = await prisma.hrProcessingMetric.upsert({
    where: { tenantId_period: { tenantId, period: data.period } },
    create: {
      period: data.period,
      totalApplications: data.totalApplications,
      processedApplications: data.processedApplications,
      accurateApplications: data.accurateApplications,
      avgTurnaroundDays: data.avgTurnaroundDays,
      reviewsCompleted: data.reviewsCompleted,
      pendingReviews: data.pendingReviews,
    },
    update: {
      totalApplications: data.totalApplications,
      processedApplications: data.processedApplications,
      accurateApplications: data.accurateApplications,
      avgTurnaroundDays: data.avgTurnaroundDays,
      reviewsCompleted: data.reviewsCompleted,
      pendingReviews: data.pendingReviews,
    },
  });
  return mapProcessingMetric(metric);
};

// ---------------------------------------------------------------------------
// 17. KPI Definitions
// ---------------------------------------------------------------------------

export const getKPIDefinitions = async (role?: string) => {
  const rows = await prisma.hrKpiDefinition.findMany({
    where: role ? { role: role.toUpperCase() } : undefined,
    orderBy: { id: 'asc' },
  });
  return rows.map(mapKpiDefinition);
};

export const createKPIDefinition = async (data: Omit<KPIDefinition, 'id'>) => {
  const def = await prisma.hrKpiDefinition.create({ data });
  return mapKpiDefinition(def);
};

export const updateKPIDefinition = async (id: string, data: Partial<KPIDefinition>) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('KPI definition not found');
  const def = await prisma.hrKpiDefinition.update({
    where: { id: numericId },
    data: {
      ...(data.role !== undefined && { role: data.role }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.target !== undefined && { target: data.target }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.frequency !== undefined && { frequency: data.frequency }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
  return mapKpiDefinition(def);
};

export const deleteKPIDefinition = async (id: string) => {
  const numericId = resolveNumericId(id);
  if (numericId !== null) {
    await prisma.hrKpiDefinition.delete({ where: { id: numericId } });
  }
  return { success: true };
};

// ---------------------------------------------------------------------------
// 18. KPI Metrics
// ---------------------------------------------------------------------------

export const getKPIMetrics = async (role?: string, period?: string) => {
  const rows = await prisma.hrKpiMetric.findMany({
    where: {
      ...(role ? { userRole: role.toUpperCase() } : {}),
      ...(period ? { period } : {}),
    },
    include: { kpiDefinition: true },
    orderBy: { id: 'asc' },
  });
  return rows.map((m) => mapKpiMetric(m, m.kpiDefinition));
};

export const recordKPIMetric = async (data: Omit<KPIMetric, 'id' | 'recordedAt'>) => {
  const kpiId = resolveNumericId(data.kpiId);
  if (kpiId === null) throw new Error('KPI definition not found');

  const existing = await prisma.hrKpiMetric.findFirst({
    where: {
      kpiId,
      period: data.period,
      userId: data.userId ?? null,
    },
  });

  if (existing) {
    const updated = await prisma.hrKpiMetric.update({
      where: { id: existing.id },
      data: {
        userRole: data.userRole,
        actualValue: data.actualValue,
        targetValue: data.targetValue,
        notes: data.notes,
      },
    });
    return mapKpiMetric(updated);
  }

  const metric = await prisma.hrKpiMetric.create({
    data: {
      kpiId,
      userId: data.userId,
      userRole: data.userRole,
      period: data.period,
      actualValue: data.actualValue,
      targetValue: data.targetValue,
      notes: data.notes,
    },
  });
  return mapKpiMetric(metric);
};

// ---------------------------------------------------------------------------
// 19. Marketing Performance
// ---------------------------------------------------------------------------

export const getMarketingPerformance = async (period?: string) => {
  const rows = await prisma.hrMarketingPerformance.findMany({
    where: period ? { period } : undefined,
    orderBy: { id: 'asc' },
  });
  return rows.map(mapMarketingPerformance);
};

export const addMarketingPerformance = async (data: Omit<MarketingPerformance, 'id'>) => {
  const record = await prisma.hrMarketingPerformance.create({ data });
  return mapMarketingPerformance(record);
};

// ---------------------------------------------------------------------------
// 20. Counsellor Performance
// ---------------------------------------------------------------------------

export const getCounsellorPerformance = async (period?: string) => {
  const rows = await prisma.hrCounsellorPerformance.findMany({
    where: period ? { period } : undefined,
    orderBy: { id: 'asc' },
  });
  return rows.map(mapCounsellorPerformance);
};

export const addCounsellorPerformance = async (
  data: Omit<CounsellorPerformance, 'id' | 'conversionRate'>
) => {
  const conversionRate =
    data.leadsHandled > 0
      ? Math.round((data.conversions / data.leadsHandled) * 1000) / 10
      : 0;

  const record = await prisma.hrCounsellorPerformance.upsert({
    where: {
      counsellorId_period: {
        counsellorId: data.counsellorId,
        period: data.period,
      },
    },
    create: {
      counsellorId: data.counsellorId,
      counsellorName: data.counsellorName,
      period: data.period,
      leadsHandled: data.leadsHandled,
      conversions: data.conversions,
      revenue: data.revenue,
      conversionRate,
    },
    update: {
      counsellorName: data.counsellorName,
      leadsHandled: data.leadsHandled,
      conversions: data.conversions,
      revenue: data.revenue,
      conversionRate,
    },
  });
  return mapCounsellorPerformance(record);
};

// ---------------------------------------------------------------------------
// 21. Payroll Deductions
// ---------------------------------------------------------------------------

export const getPayrollDeductions = async (month?: number, year?: number) => {
  const rows = await prisma.hrPayrollDeduction.findMany({
    where: {
      ...(month !== undefined ? { month } : {}),
      ...(year !== undefined ? { year } : {}),
    },
    include: { employee: true },
    orderBy: { id: 'asc' },
  });
  return rows.map((d) => mapPayrollDeduction(d, d.employee));
};

export const upsertPayrollDeduction = async (
  data: Omit<PayrollDeduction, 'id' | 'totalDeductions'>
) => {
  const emp = await resolveEmployeeId(data.employeeId);
  if (!emp) throw new Error('Employee not found');

  const totalDeductions = data.leaveDeduction + data.taxAmount + data.otherDeductions;

  const deduction = await prisma.hrPayrollDeduction.upsert({
    where: {
      employeeId_month_year: {
        employeeId: emp.id,
        month: data.month,
        year: data.year,
      },
    },
    create: {
      employeeId: emp.id,
      month: data.month,
      year: data.year,
      leaveDays: data.leaveDays,
      leaveDeduction: data.leaveDeduction,
      taxAmount: data.taxAmount,
      otherDeductions: data.otherDeductions,
      totalDeductions,
    },
    update: {
      leaveDays: data.leaveDays,
      leaveDeduction: data.leaveDeduction,
      taxAmount: data.taxAmount,
      otherDeductions: data.otherDeductions,
      totalDeductions,
    },
  });
  return mapPayrollDeduction(deduction);
};

// ---------------------------------------------------------------------------
// 22. Performance Reviews
// ---------------------------------------------------------------------------

const reviewStatusToApi: Record<HrReviewStatus, string> = {
  SELF_REVIEW: 'Self-Review',
  MANAGER_REVIEW: 'Manager Review',
  CALIBRATED: 'Calibrated',
  COMPLETED: 'Completed',
};

const reviewStatusFromApi = (status: string): HrReviewStatus => {
  const map: Record<string, HrReviewStatus> = {
    'Self-Review': 'SELF_REVIEW',
    'Manager Review': 'MANAGER_REVIEW',
    Calibrated: 'CALIBRATED',
    Completed: 'COMPLETED',
    SELF_REVIEW: 'SELF_REVIEW',
    MANAGER_REVIEW: 'MANAGER_REVIEW',
    CALIBRATED: 'CALIBRATED',
    COMPLETED: 'COMPLETED',
  };
  return map[status] ?? 'SELF_REVIEW';
};

const mapPerformanceReview = (r: HrPerformanceReview): PerformanceReview => ({
  id: sid(r.id),
  name: r.name,
  employeeId: r.employeeCode,
  department: r.department,
  cycle: r.cycle,
  manager: r.manager,
  rating: r.rating,
  status: reviewStatusToApi[r.status],
  date: r.reviewDate,
});

export const getPerformanceReviews = async (search?: string) => {
  const rows = await prisma.hrPerformanceReview.findMany({
    orderBy: { reviewDate: 'desc' },
  });
  const reviews = rows.map(mapPerformanceReview);
  if (!search) return reviews;
  const q = search.toLowerCase();
  return reviews.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.employeeId.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q)
  );
};

export const createPerformanceReview = async (data: {
  name: string;
  employeeId: string;
  department: string;
  cycle: string;
  manager: string;
  status?: string;
  rating?: number;
  date?: string;
}) => {
  const emp = await resolveEmployeeId(data.employeeId);
  const review = await prisma.hrPerformanceReview.create({
    data: {
      employeeId: emp?.id ?? null,
      name: data.name,
      employeeCode: data.employeeId,
      department: data.department,
      cycle: data.cycle,
      manager: data.manager,
      rating: data.rating ?? 0,
      status: reviewStatusFromApi(data.status ?? 'Self-Review'),
      reviewDate: data.date ?? new Date().toISOString().split('T')[0],
    },
  });
  return mapPerformanceReview(review);
};

export const updatePerformanceReview = async (
  id: string,
  data: Partial<{
    rating: number;
    status: string;
    manager: string;
    cycle: string;
    department: string;
    date: string;
  }>
) => {
  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) throw new Error('Performance review not found');

  const review = await prisma.hrPerformanceReview.update({
    where: { id: numericId },
    data: {
      ...(data.rating !== undefined ? { rating: data.rating } : {}),
      ...(data.status !== undefined ? { status: reviewStatusFromApi(data.status) } : {}),
      ...(data.manager !== undefined ? { manager: data.manager } : {}),
      ...(data.cycle !== undefined ? { cycle: data.cycle } : {}),
      ...(data.department !== undefined ? { department: data.department } : {}),
      ...(data.date !== undefined ? { reviewDate: data.date } : {}),
    },
  });
  return mapPerformanceReview(review);
};

// ---------------------------------------------------------------------------
// Leave requests
// ---------------------------------------------------------------------------

const mapLeaveRequest = (r: {
  id: number;
  employeeId: number;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string | null;
  status: string;
  reviewerNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  employee?: HrEmployee;
}) => ({
  id: sid(r.id),
  employeeId: sid(r.employeeId),
  employeeName: r.employee?.name || '',
  employeeEmail: r.employee?.email || '',
  leaveTypeName: r.leaveTypeName,
  fromDate: r.fromDate,
  toDate: r.toDate,
  days: r.days,
  reason: r.reason,
  status: r.status,
  reviewerNote: r.reviewerNote,
  reviewedAt: r.reviewedAt?.toISOString() || null,
  createdAt: r.createdAt.toISOString(),
});

export const getLeaveRequests = async (opts: {
  employeeId?: string;
  status?: string;
  mineEmail?: string;
}) => {
  const where: Record<string, unknown> = {};
  if (opts.status) where.status = opts.status;
  if (opts.mineEmail) {
    const emp = await prisma.hrEmployee.findFirst({ where: { email: opts.mineEmail } });
    if (!emp) return [];
    where.employeeId = emp.id;
  } else if (opts.employeeId) {
    const emp = await resolveEmployeeId(opts.employeeId);
    if (emp) where.employeeId = emp.id;
  }
  const rows = await prisma.hrLeaveRequest.findMany({
    where,
    include: { employee: true },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapLeaveRequest);
};

export const createLeaveRequest = async (
  userEmail: string,
  data: { leaveTypeName: string; fromDate: string; toDate: string; days: number; reason?: string }
) => {
  // Strict match: the leave request must be filed against the caller's own
  // employee record. The Prisma extension scopes by the active tenant so we
  // can never match an employee in another tenant. No fallback — if no record
  // matches, the caller gets a clear error instead of a phantom request
  // attached to whichever employee happened to sort first.
  const emp = await prisma.hrEmployee.findFirst({ where: { email: userEmail } });
  if (!emp) {
    throw new Error('No HR employee record matches your login email');
  }

  const row = await prisma.hrLeaveRequest.create({
    data: {
      employeeId: emp.id,
      leaveTypeName: data.leaveTypeName,
      fromDate: data.fromDate,
      toDate: data.toDate,
      days: data.days,
      reason: data.reason || null,
      status: 'PENDING',
    },
    include: { employee: true },
  });
  return mapLeaveRequest(row);
};

export const processLeaveRequest = async (
  id: string,
  data: { status: 'APPROVED' | 'REJECTED'; reviewerNote?: string }
) => {
  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) throw new Error('Leave request not found');

  // findUnique is no longer auto-scoped, so verify the row belongs to the
  // active tenant before mutating. findFirst IS auto-scoped → returns null
  // if the id belongs to another tenant.
  const existing = await prisma.hrLeaveRequest.findFirst({ where: { id: numericId } });
  if (!existing) throw new Error('Leave request not found');

  const row = await prisma.hrLeaveRequest.update({
    where: { id: numericId },
    data: {
      status: data.status,
      reviewerNote: data.reviewerNote || null,
      reviewedAt: new Date(),
    },
    include: { employee: true },
  });
  return mapLeaveRequest(row);
};

export const cancelLeaveRequest = async (id: string, userEmail: string) => {
  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) throw new Error('Leave request not found');

  // findFirst is auto-scoped to the active tenant.
  const existing = await prisma.hrLeaveRequest.findFirst({
    where: { id: numericId },
    include: { employee: true },
  });
  if (!existing) throw new Error('Leave request not found');
  if (existing.employee.email !== userEmail) throw new Error('Not authorized to cancel this request');
  if (existing.status !== 'PENDING') throw new Error('Only pending requests can be cancelled');

  const row = await prisma.hrLeaveRequest.update({
    where: { id: numericId },
    data: { status: 'CANCELLED' },
    include: { employee: true },
  });
  return mapLeaveRequest(row);
};

// ---------------------------------------------------------------------------
// HR dashboard summary
// ---------------------------------------------------------------------------

export const getHrMe = async (userEmail: string) => {
  const employee = await prisma.hrEmployee.findFirst({ where: { email: userEmail } });

  if (!employee) {
    return {
      employee: null,
      leaveBalances: [],
      recentLeaveRequests: [],
      recentPayslips: [],
      pendingRegularizations: 0,
      todayAttendance: null,
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const [planAssignment, leaveRequests, payslips, pendingRegs, todayRecord] = await Promise.all([
    prisma.hrLeavePlanAssignment.findFirst({
      where: { employeeId: employee.id },
      include: { plan: { include: { definitions: { include: { leaveType: true } } } } },
    }),
    prisma.hrLeaveRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.hrPayslip.findMany({
      where: { employeeId: employee.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 6,
    }),
    prisma.hrRegularization.count({
      where: { employeeId: employee.id, status: 'PENDING' },
    }),
    prisma.hrAttendanceRecord.findFirst({
      where: { employeeId: employee.id, date: todayStr },
    }),
  ]);

  const approvedThisYear = await prisma.hrLeaveRequest.findMany({
    where: {
      employeeId: employee.id,
      status: 'APPROVED',
      fromDate: { gte: yearStart },
    },
  });

  const usedByType: Record<string, number> = {};
  for (const req of approvedThisYear) {
    usedByType[req.leaveTypeName] = (usedByType[req.leaveTypeName] || 0) + req.days;
  }

  const leaveBalances =
    planAssignment?.plan.definitions.map((def) => ({
      leaveType: def.leaveType.name,
      annualQuota: def.annualQuota,
      used: usedByType[def.leaveType.name] || 0,
      remaining: Math.max(0, def.annualQuota - (usedByType[def.leaveType.name] || 0)),
    })) || [];

  return {
    employee: mapEmployee(employee),
    leaveBalances,
    recentLeaveRequests: leaveRequests.map(mapLeaveRequest),
    recentPayslips: payslips.map(mapPayslip),
    pendingRegularizations: pendingRegs,
    todayAttendance: todayRecord
      ? {
          date: todayRecord.date,
          checkIn: todayRecord.checkIn?.toISOString() || null,
          checkOut: todayRecord.checkOut?.toISOString() || null,
          status: todayRecord.status,
        }
      : null,
  };
};

export const getHrDashboardSummary = async () => {
  const [
    openJobs,
    candidates,
    pendingLeave,
    pendingRegularizations,
    employeeCount,
    openInterviews,
  ] = await Promise.all([
    prisma.hrJobPosting.count({ where: { status: 'OPEN' } }),
    prisma.hrCandidate.count({ where: { status: 'ACTIVE' } }),
    prisma.hrLeaveRequest.count({ where: { status: 'PENDING' } }),
    prisma.hrRegularization.count({ where: { status: 'PENDING' } }),
    prisma.hrEmployee.count(),
    prisma.hrInterview.count({ where: { status: 'SCHEDULED' } }),
  ]);

  return {
    openPositions: openJobs,
    candidatesInPipeline: candidates,
    pendingLeaveRequests: pendingLeave,
    pendingRegularizations,
    employeeCount,
    scheduledInterviews: openInterviews,
  };
};
