import { prisma } from '../../prisma.js';
import type {
  Employee,
  EmployeeDocument,
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
  OnboardingTemplate,
  OnboardingTemplateItem,
  OfferLetter,
  OfferLetterTemplate,
  CandidateStageEvent,
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
  CounsellorConversionMetric,
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
  HrOnboardingTemplate,
  HrOnboardingTemplateItem,
  HrOfferLetter,
  HrOfferLetterTemplate,
  HrCandidateStageEvent,
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
  HrEmploymentStatus,
  HrEmployeeDocument,
  HrEmployeeDocumentType,
} from '@prisma/client';
import { storeUploadedFile } from '../../lib/file-storage.js';
import {
  detectPeriodType,
  formatReviewCycle,
  parseReviewPeriod,
} from './hr-period.js';

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

/** Match the logged-in user to their HR employee row (userId link, then email). */
export const resolveEmployeeForUser = async (
  userId: number,
  email?: string | null
): Promise<HrEmployee | null> => {
  const byUser = await prisma.hrEmployee.findFirst({ where: { userId } });
  if (byUser) return byUser;
  if (email) {
    return prisma.hrEmployee.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
  }
  return null;
};

const todayDateString = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: process.env.HR_TIMEZONE || 'Asia/Kolkata' }).format(
    new Date()
  );

type EmployeeRow = HrEmployee & { manager?: HrEmployee | null };

const splitName = (full: string) => {
  const trimmed = (full ?? '').trim();
  const spaceIdx = trimmed.indexOf(' ');
  return {
    first: spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx),
    last: spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1),
  };
};

const mapEmployee = (e: EmployeeRow): Employee => {
  const { first, last } = splitName(e.name);
  const first_name = e.firstName ?? first;
  const last_name = e.lastName ?? last;
  return {
    id: sid(e.id),
    name: e.name,
    first_name,
    last_name,
    firstName: e.firstName,
    lastName: e.lastName,
    employeeId: e.employeeCode,
    employee_id: e.employeeCode,
    email: e.email,
    access_role: e.accessRole,
    department: e.department,
    designation: e.designation,
    phone: e.phone,
    biometricId: e.biometricId,
    location: e.location,
    joiningDate: e.joiningDate,
    managerId: e.managerId ? sid(e.managerId) : null,
    managerName: e.manager?.name ?? null,
    employmentStatus: e.employmentStatus,
    resignedAt: e.resignedAt?.toISOString() ?? null,
    terminatedAt: e.terminatedAt?.toISOString() ?? null,
    exitReason: e.exitReason,
  };
};

const mapEmployeeDocument = (d: HrEmployeeDocument): EmployeeDocument => ({
  id: sid(d.id),
  employeeId: sid(d.employeeId),
  type: d.type,
  fileName: d.fileName,
  fileUrl: d.fileUrl,
  mimeType: d.mimeType,
  fileSize: d.fileSize,
  uploadedAt: d.uploadedAt.toISOString(),
  expiresAt: d.expiresAt?.toISOString() ?? null,
  notes: d.notes,
  sourceOfferLetterId: d.sourceOfferLetterId ? sid(d.sourceOfferLetterId) : null,
});

/** Set ON_LEAVE when an approved leave covers today; otherwise ACTIVE (unless exited). */
export const syncEmployeeLeaveStatus = async (
  employeeId: number,
  db: Pick<typeof prisma, 'hrEmployee' | 'hrLeaveRequest'> = prisma,
) => {
  const emp = await db.hrEmployee.findUnique({ where: { id: employeeId } });
  if (!emp || emp.employmentStatus === 'RESIGNED' || emp.employmentStatus === 'TERMINATED') {
    return;
  }
  const today = todayDateString();
  const activeLeave = await db.hrLeaveRequest.findFirst({
    where: {
      employeeId,
      status: 'APPROVED',
      fromDate: { lte: today },
      toDate: { gte: today },
    },
  });
  const nextStatus: HrEmploymentStatus = activeLeave ? 'ON_LEAVE' : 'ACTIVE';
  if (emp.employmentStatus !== nextStatus) {
    await db.hrEmployee.update({
      where: { id: employeeId },
      data: { employmentStatus: nextStatus },
    });
  }
};

const linkOfferLetterToEmployee = async (
  tx: typeof prisma,
  employeeId: number,
  tenantId: number | null,
  offer: HrOfferLetter,
) => {
  const storedName = `offer-letter-${offer.id}.html`;
  const html =
    offer.renderedHtml ||
    `<html><body><h1>Offer Letter</h1><p>${offer.candidateName} — ${offer.jobTitle}</p><p>Department: ${offer.department}</p></body></html>`;
  const relativePath = `uploads/hr/employees/${employeeId}/${storedName}`;
  const { ref: fileUrl } = await storeUploadedFile({
    relativePath,
    buffer: Buffer.from(html, 'utf8'),
    contentType: 'text/html',
  });

  const existing = await tx.hrEmployeeDocument.findFirst({
    where: { employeeId, sourceOfferLetterId: offer.id },
  });
  if (existing) return existing;

  return tx.hrEmployeeDocument.create({
    data: {
      tenantId: tenantId ?? undefined,
      employeeId,
      type: 'OFFER_LETTER',
      fileName: `Offer Letter - ${offer.jobTitle}.html`,
      fileUrl,
      mimeType: 'text/html',
      fileSize: Buffer.byteLength(html, 'utf8'),
      sourceOfferLetterId: offer.id,
      notes: 'Linked from accepted recruitment offer',
    },
  });
};

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
  cycle: 'Apr - Mar',
  description: p.description ?? undefined,
});

const mapLeaveType = (t: HrLeaveType): LeaveType => ({
  id: sid(t.id),
  name: t.name,
  code: t.code,
});

type AccrualLeaveDef = Pick<HrLeaveDefinition, 'annualQuota' | 'accrualType' | 'accrualRate'>;

/** Days an employee may use as of `asOf` based on accrual policy. */
export const computeLeaveEntitlement = (def: AccrualLeaveDef, asOf = new Date()): number => {
  const month = asOf.getMonth() + 1;
  const accrualType = def.accrualType || 'yearly';
  const rate = def.accrualRate ?? 0;

  if (accrualType === 'monthly' && rate > 0) {
    return Math.min(def.annualQuota, rate * month);
  }
  if (accrualType === 'quarterly' && rate > 0) {
    const quarters = Math.ceil(month / 3);
    return Math.min(def.annualQuota, rate * quarters);
  }
  return def.annualQuota;
};

const mapLeaveDefinition = (
  d: HrLeaveDefinition & { leaveType?: { code: string; name: string } | null },
): LeaveDefinition => ({
  id: sid(d.id),
  plan_id: sid(d.planId),
  leave_type_id: sid(d.leaveTypeId),
  name: d.name,
  annual_quota: d.annualQuota,
  carry_forward: d.carryForward,
  // Extra fields the LeaveManagement page expects. Derived from the joined
  // HrLeaveType row; safe defaults so the UI never renders undefined.
  type_code: d.leaveType?.code ?? '',
  type_name: d.leaveType?.name ?? d.name,
  leave_type_code: d.leaveType?.code ?? '',
  leave_type_name: d.leaveType?.name ?? d.name,
  is_unlimited: false,
  accrual_type: d.accrualType ?? 'yearly',
  accrual_rate: d.accrualRate ?? 0,
  year_end_policy: d.carryForward ? 'carry_forward' : 'reset',
  carry_forward_max: d.carryForward ? d.annualQuota : 0,
  min_days_per_request: 0.5,
  max_days_per_request: d.annualQuota,
  gender_restriction: 'all',
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
  incentivePerEnrollment: s.incentivePerEnrollment,
  incentiveRevenueShare: s.incentiveRevenueShare,
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
  performanceIncentive: p.performanceIncentive,
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
  dueDate: i.dueDate ?? undefined,
  assignee: i.assignee ?? undefined,
  attachmentUrl: i.attachmentUrl ?? undefined,
  attachmentFileName: i.attachmentFileName ?? undefined,
});

const mapOnboardingTemplateItem = (i: HrOnboardingTemplateItem): OnboardingTemplateItem => ({
  id: sid(i.id),
  category: i.category,
  title: i.title,
  description: i.description ?? undefined,
  dueOffsetDays: i.dueOffsetDays,
  assigneeRole: i.assigneeRole ?? undefined,
  sortOrder: i.sortOrder,
});

const mapOnboardingTemplate = (
  t: HrOnboardingTemplate & { items: HrOnboardingTemplateItem[] },
): OnboardingTemplate => ({
  id: sid(t.id),
  name: t.name,
  description: t.description ?? undefined,
  isDefault: t.isDefault,
  role: t.role ?? undefined,
  items: t.items.map(mapOnboardingTemplateItem),
  createdAt: t.createdAt.toISOString(),
});

const mapOfferLetterTemplate = (t: HrOfferLetterTemplate): OfferLetterTemplate => ({
  id: sid(t.id),
  name: t.name,
  description: t.description ?? undefined,
  bodyHtml: t.bodyHtml,
  isDefault: t.isDefault,
  createdAt: t.createdAt.toISOString(),
  updatedAt: t.updatedAt.toISOString(),
});

const mapCandidateStageEvent = (
  e: HrCandidateStageEvent & { changedBy?: { id: number; fullName: string } | null },
): CandidateStageEvent => ({
  id: sid(e.id),
  candidateId: sid(e.candidateId),
  fromStage: e.fromStage ?? undefined,
  toStage: e.toStage,
  changedById: e.changedById ? sid(e.changedById) : undefined,
  changedByName: e.changedBy?.fullName,
  notes: e.notes ?? undefined,
  createdAt: e.createdAt.toISOString(),
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
  templateId: o.templateId ? sid(o.templateId) : undefined,
  renderedHtml: o.renderedHtml ?? undefined,
  conditional: o.conditional,
  acceptedAt: o.acceptedAt?.toISOString(),
  rejectedAt: o.rejectedAt?.toISOString(),
  employeeId: o.employeeId ? sid(o.employeeId) : undefined,
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

export const getEmployees = async (opts?: { status?: HrEmploymentStatus }) => {
  const rows = await prisma.hrEmployee.findMany({
    where: opts?.status ? { employmentStatus: opts.status } : undefined,
    orderBy: { id: 'asc' },
    include: { manager: true },
  });
  return rows.map(mapEmployee);
};

export const getEmployeeById = async (id: string) => {
  const emp = await resolveEmployeeId(id);
  if (!emp) return null;
  const row = await prisma.hrEmployee.findUnique({
    where: { id: emp.id },
    include: { manager: true },
  });
  return row ? mapEmployee(row) : null;
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
  const errors: string[] = [];
  for (const row of rows) {
    try {
      await createEmployee(row);
      importedCount++;
    } catch (error: any) {
      errors.push(error?.message || 'Import failed for a row');
    }
  }
  return { success: true, count: importedCount, errors };
};

export const createEmployee = async (row: Partial<Employee>) => {
  if (!row.name || !row.email || !row.employeeId) {
    throw new Error('Name, email, and employee ID are required');
  }

  const exists = await prisma.hrEmployee.findFirst({
    where: {
      OR: [
        { email: { equals: row.email, mode: 'insensitive' } },
        { employeeCode: row.employeeId },
      ],
    },
  });
  if (exists) {
    if (exists.email.toLowerCase() === row.email.toLowerCase()) {
      throw new Error('An employee with this email already exists');
    }
    throw new Error('An employee with this employee ID already exists');
  }

  let managerDbId: number | undefined;
  if (row.managerId) {
    const manager = await resolveEmployeeId(row.managerId);
    if (!manager) throw new Error('Manager not found');
    managerDbId = manager.id;
  }

  const { first, last } = splitName(row.name);
  const created = await prisma.hrEmployee.create({
    data: {
      name: row.name,
      firstName: row.firstName ?? first,
      lastName: row.lastName ?? last,
      employeeCode: row.employeeId,
      email: row.email,
      accessRole: (row.access_role as HrAccessRole) || 'EMPLOYEE',
      department: row.department || 'Operations',
      designation: row.designation || 'Staff Member',
      phone: row.phone || null,
      biometricId: row.biometricId || row.employeeId,
      location: row.location || 'HQ Office',
      joiningDate: row.joiningDate || null,
      managerId: managerDbId,
      employmentStatus: 'ACTIVE',
    },
    include: { manager: true },
  });
  return mapEmployee(created);
};

export const updateEmployee = async (
  employeeId: string,
  data: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string | null;
    department?: string | null;
    designation?: string | null;
    location?: string | null;
    biometricId?: string | null;
    joiningDate?: string | null;
    managerId?: string | null;
    access_role?: string;
    employmentStatus?: HrEmploymentStatus;
    resignedAt?: string | null;
    terminatedAt?: string | null;
    exitReason?: string | null;
  },
) => {
  const emp = await resolveEmployeeId(employeeId);
  if (!emp) throw new Error('Employee not found');

  let managerDbId: number | null | undefined;
  if (data.managerId !== undefined) {
    if (data.managerId === null || data.managerId === '') {
      managerDbId = null;
    } else {
      const manager = await resolveEmployeeId(data.managerId);
      if (!manager) throw new Error('Manager not found');
      if (manager.id === emp.id) throw new Error('Employee cannot be their own manager');
      managerDbId = manager.id;
    }
  }

  const name =
    data.name ??
    (data.firstName !== undefined || data.lastName !== undefined
      ? `${data.firstName ?? emp.firstName ?? splitName(emp.name).first} ${data.lastName ?? emp.lastName ?? splitName(emp.name).last}`.trim()
      : undefined);

  const updated = await prisma.hrEmployee.update({
    where: { id: emp.id },
    data: {
      ...(name !== undefined && { name }),
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.department !== undefined && { department: data.department }),
      ...(data.designation !== undefined && { designation: data.designation }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.biometricId !== undefined && { biometricId: data.biometricId }),
      ...(data.joiningDate !== undefined && { joiningDate: data.joiningDate }),
      ...(managerDbId !== undefined && { managerId: managerDbId }),
      ...(data.access_role !== undefined && { accessRole: data.access_role as HrAccessRole }),
      ...(data.employmentStatus !== undefined && { employmentStatus: data.employmentStatus }),
      ...(data.resignedAt !== undefined && {
        resignedAt: data.resignedAt ? new Date(data.resignedAt) : null,
      }),
      ...(data.terminatedAt !== undefined && {
        terminatedAt: data.terminatedAt ? new Date(data.terminatedAt) : null,
      }),
      ...(data.exitReason !== undefined && { exitReason: data.exitReason }),
    },
    include: { manager: true },
  });

  if (data.employmentStatus === 'ACTIVE' || data.employmentStatus === 'ON_LEAVE') {
    await syncEmployeeLeaveStatus(updated.id);
    const refreshed = await prisma.hrEmployee.findUnique({
      where: { id: updated.id },
      include: { manager: true },
    });
    return mapEmployee(refreshed!);
  }

  return mapEmployee(updated);
};

export const getEmployeeDocuments = async (employeeId: string) => {
  const emp = await resolveEmployeeId(employeeId);
  if (!emp) throw new Error('Employee not found');
  const docs = await prisma.hrEmployeeDocument.findMany({
    where: { employeeId: emp.id },
    orderBy: [{ type: 'asc' }, { uploadedAt: 'desc' }],
  });
  return docs.map(mapEmployeeDocument);
};

export const createEmployeeDocument = async (
  employeeId: string,
  data: {
    type: HrEmployeeDocumentType;
    fileName: string;
    fileUrl: string;
    mimeType?: string | null;
    fileSize?: number | null;
    expiresAt?: string | null;
    notes?: string | null;
    tenantId?: number | null;
  },
) => {
  const emp = await resolveEmployeeId(employeeId);
  if (!emp) throw new Error('Employee not found');
  const doc = await prisma.hrEmployeeDocument.create({
    data: {
      tenantId: data.tenantId ?? emp.tenantId ?? undefined,
      employeeId: emp.id,
      type: data.type,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      mimeType: data.mimeType ?? null,
      fileSize: data.fileSize ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      notes: data.notes ?? null,
    },
  });
  return mapEmployeeDocument(doc);
};

export const deleteEmployeeDocument = async (employeeId: string, docId: string) => {
  const emp = await resolveEmployeeId(employeeId);
  if (!emp) throw new Error('Employee not found');
  const numericDocId = resolveNumericId(docId);
  if (numericDocId === null) throw new Error('Document not found');
  const doc = await prisma.hrEmployeeDocument.findFirst({
    where: { id: numericDocId, employeeId: emp.id },
  });
  if (!doc) throw new Error('Document not found');
  await prisma.hrEmployeeDocument.delete({ where: { id: doc.id } });
  return { success: true };
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

// Date filter is required at scale. Default is "today only" so the admin sees
// the live feed without scrolling through history. Pass YYYY-MM-DD for a
// specific day, or 'all' to retrieve everything (use with caution).
export const getAttendanceEvents = async (date?: string) => {
  const whereDate =
    date === 'all'
      ? undefined
      : date && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date
        : new Date().toISOString().slice(0, 10);

  const records = await prisma.hrAttendanceRecord.findMany({
    where: whereDate ? { date: whereDate } : undefined,
    include: { employee: true },
    orderBy: { id: 'desc' },
    take: whereDate ? undefined : 500, // safety cap for 'all'
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
  userId: number,
  userEmail: string | null | undefined,
  data: { ip: string; coordinates?: string; isCheckOut?: boolean }
) => {
  const dateStr = todayDateString();
  const now = new Date();

  const emp = await resolveEmployeeForUser(userId, userEmail);
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
  userId: number,
  userEmail: string | null | undefined,
  month?: number,
  year?: number
) => {
  const employee = await resolveEmployeeForUser(userId, userEmail);

  const m = month ?? new Date().getMonth() + 1;
  const y = year ?? new Date().getFullYear();
  const todayStr = todayDateString();
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

export const deleteLeavePlan = async (planId: string) => {
  const numericPlanId = resolveNumericId(planId);
  if (numericPlanId === null) throw new Error('Leave plan not found');
  const existing = await prisma.hrLeavePlan.findFirst({ where: { id: numericPlanId } });
  if (!existing) throw new Error('Leave plan not found');
  await prisma.hrLeavePlan.delete({ where: { id: numericPlanId } });
  return { success: true };
};

export const getLeaveTypes = async (tenantId?: number | null) => {
  const where =
    tenantId == null
      ? {}
      : { OR: [{ tenantId }, { tenantId: null }] };
  const rows = await prisma.hrLeaveType.findMany({ where, orderBy: { id: 'asc' } });
  return rows.map(mapLeaveType);
};

export const createLeaveType = async (
  tenantId: number,
  data: { name: string; code: string },
) => {
  const code = data.code.trim().toUpperCase();
  const existing = await prisma.hrLeaveType.findFirst({
    where: { tenantId, code },
  });
  if (existing) throw new Error(`Category code "${code}" already exists`);
  const row = await prisma.hrLeaveType.create({
    data: { tenantId, name: data.name.trim(), code },
  });
  return mapLeaveType(row);
};

export const updateLeaveType = async (
  tenantId: number,
  id: string,
  data: { name?: string; code?: string },
) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Leave category not found');
  const existing = await prisma.hrLeaveType.findFirst({
    where: { id: numericId, tenantId },
  });
  if (!existing) throw new Error('Leave category not found');
  const patch: { name?: string; code?: string } = {};
  if (data.name != null) patch.name = data.name.trim();
  if (data.code != null) {
    const code = data.code.trim().toUpperCase();
    if (code !== existing.code) {
      const dup = await prisma.hrLeaveType.findFirst({
        where: { tenantId, code, NOT: { id: numericId } },
      });
      if (dup) throw new Error(`Category code "${code}" already exists`);
    }
    patch.code = code;
  }
  const row = await prisma.hrLeaveType.update({ where: { id: numericId }, data: patch });
  return mapLeaveType(row);
};

export const deleteLeaveType = async (tenantId: number, id: string) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Leave category not found');
  const existing = await prisma.hrLeaveType.findFirst({
    where: { id: numericId, tenantId },
  });
  if (!existing) throw new Error('Leave category not found');
  const inUse = await prisma.hrLeaveDefinition.count({
    where: { leaveTypeId: numericId },
  });
  if (inUse > 0) {
    throw new Error('Category is in use by an entitlement plan; remove definitions first');
  }
  await prisma.hrLeaveType.delete({ where: { id: numericId } });
  return { id };
};

export const getLeaveDefinitions = async (planId: string) => {
  const numericPlanId = resolveNumericId(planId);
  if (numericPlanId === null) return [];
  const rows = await prisma.hrLeaveDefinition.findMany({
    where: { planId: numericPlanId },
    include: { leaveType: { select: { code: true, name: true } } },
    orderBy: { id: 'asc' },
  });
  return rows.map(mapLeaveDefinition);
};

export const addLeaveDefinition = async (
  planId: string,
  data: {
    leaveTypeId: string;
    annual_quota: number;
    carry_forward?: boolean;
    accrual_type?: string;
    accrual_rate?: number;
  }
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
      annualQuota: data.annual_quota ?? 10,
      carryForward: data.carry_forward ?? false,
      accrualType: data.accrual_type ?? 'yearly',
      accrualRate: data.accrual_rate ?? 0,
    },
    update: {
      name: lt.name,
      annualQuota: data.annual_quota ?? 10,
      carryForward: data.carry_forward ?? false,
      accrualType: data.accrual_type ?? 'yearly',
      accrualRate: data.accrual_rate ?? 0,
    },
    include: { leaveType: { select: { code: true, name: true } } },
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

export const removeLeavePlanEmployee = async (planId: string, employeeId: string) => {
  const numericPlanId = resolveNumericId(planId);
  if (numericPlanId === null) throw new Error('Leave plan not found');

  const emp = await resolveEmployeeId(employeeId);
  if (!emp) throw new Error('Employee not found');

  await prisma.hrLeavePlanAssignment.deleteMany({
    where: { planId: numericPlanId, employeeId: emp.id },
  });
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
      incentivePerEnrollment: Number(data.incentivePerEnrollment ?? 0),
      incentiveRevenueShare: Number(data.incentiveRevenueShare ?? 0),
    },
    update: {
      basicSalary: Number(data.basicSalary),
      allowances: Number(data.allowances),
      deductions: Number(data.deductions),
      incentivePerEnrollment: Number(data.incentivePerEnrollment ?? 0),
      incentiveRevenueShare: Number(data.incentiveRevenueShare ?? 0),
    },
  });
  return {
    id: sid(struct.id),
    employeeId: sid(struct.employeeId),
    basicSalary: struct.basicSalary,
    allowances: struct.allowances,
    deductions: struct.deductions,
    incentivePerEnrollment: struct.incentivePerEnrollment,
    incentiveRevenueShare: struct.incentiveRevenueShare,
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
  const payrollPeriod = `${year}-${String(month).padStart(2, '0')}`;

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

    const performanceIncentive = await computePerformanceIncentive(
      struct.employeeId,
      payrollPeriod
    );
    const totalAllowances = struct.allowances + performanceIncentive;

    const totalDeductions =
      struct.deductions +
      (deduction?.leaveDeduction ?? 0) +
      (deduction?.taxAmount ?? 0) +
      (deduction?.otherDeductions ?? 0);
    const netSalary = struct.basicSalary + totalAllowances - totalDeductions;

    const newPay = await prisma.hrPayslip.create({
      data: {
        employeeId: struct.employeeId,
        name: struct.employee.name,
        month,
        year,
        basicSalary: struct.basicSalary,
        allowances: totalAllowances,
        performanceIncentive,
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
  templateId?: string;
  tenantId?: number | null;
}) => {
  if (data.templateId) {
    return createOnboardingChecklistFromTemplate(data.tenantId ?? null, {
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      startDate: data.startDate,
      templateId: data.templateId,
    });
  }
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
  data: {
    status: 'PENDING' | 'COMPLETED';
    completedBy?: string;
    attachmentUrl?: string | null;
    attachmentFileName?: string | null;
    notes?: string | null;
  },
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
      ...(data.attachmentUrl !== undefined && { attachmentUrl: data.attachmentUrl }),
      ...(data.attachmentFileName !== undefined && { attachmentFileName: data.attachmentFileName }),
      ...(data.notes !== undefined && { description: data.notes }),
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
  const today = new Date().toISOString().slice(0, 10);
  await prisma.hrOfferLetter.updateMany({
    where: { status: 'SENT', expiryDate: { lt: today } },
    data: { status: 'EXPIRED' },
  });
  const rows = await prisma.hrOfferLetter.findMany({ orderBy: { id: 'desc' } });
  return rows.map(mapOfferLetter);
};

export const getOfferLetterById = async (id: string) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) return null;
  const row = await prisma.hrOfferLetter.findUnique({ where: { id: numericId } });
  return row ? mapOfferLetter(row) : null;
};

const requireCandidateId = (candidateIdStr: string) => {
  const candidateId = resolveNumericId(candidateIdStr);
  if (candidateId === null) throw new Error('Candidate not found');
  return candidateId;
};

export const createOfferLetter = async (
  data: Omit<OfferLetter, 'id' | 'createdAt' | 'updatedAt' | 'conditional' | 'acceptedAt' | 'rejectedAt' | 'employeeId' | 'renderedHtml'> & {
    conditional?: boolean;
    templateId?: string;
  },
  ctx?: { tenantId?: number | null },
) => {
  const candidateId = requireCandidateId(data.candidateId);
  const templateId = data.templateId ? resolveNumericId(data.templateId) : null;
  const letter = await prisma.hrOfferLetter.create({
    data: {
      candidateId,
      candidateName: data.candidateName,
      candidateEmail: data.candidateEmail,
      jobTitle: data.jobTitle,
      department: data.department,
      offeredSalary: data.offeredSalary,
      joiningDate: data.joiningDate,
      expiryDate: data.expiryDate,
      status: data.status,
      policyTemplate: data.policyTemplate,
      templateId: templateId ?? undefined,
      conditional: data.conditional ?? false,
    },
  });
  if (data.status === 'SENT' || templateId) {
    try {
      await renderOfferLetterHtml(sid(letter.id), { tenantId: ctx?.tenantId ?? null });
    } catch {
      // render is best-effort when no template exists yet
    }
  }
  const refreshed = await prisma.hrOfferLetter.findUnique({ where: { id: letter.id } });
  return mapOfferLetter(refreshed!);
};

export const updateOfferLetterStatus = async (id: string, status: OfferLetter['status']) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Offer letter not found');
  const patch: Record<string, unknown> = { status };
  if (status === 'ACCEPTED') patch.acceptedAt = new Date();
  if (status === 'REJECTED') patch.rejectedAt = new Date();
  const letter = await prisma.hrOfferLetter.update({
    where: { id: numericId },
    data: patch,
  });
  return mapOfferLetter(letter);
};

// ---------------------------------------------------------------------------
// Offer letter templates (tenant-configurable)
// ---------------------------------------------------------------------------

const offerTemplateScope = (tenantId: number | null) =>
  tenantId == null ? {} : { OR: [{ tenantId }, { tenantId: null }] };

export const getOfferLetterTemplates = async (tenantId: number | null = null) => {
  const rows = await prisma.hrOfferLetterTemplate.findMany({
    where: offerTemplateScope(tenantId),
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
  return rows.map(mapOfferLetterTemplate);
};

export const getOfferLetterTemplate = async (id: string) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) return null;
  const row = await prisma.hrOfferLetterTemplate.findUnique({ where: { id: numericId } });
  return row ? mapOfferLetterTemplate(row) : null;
};

export const createOfferLetterTemplate = async (
  tenantId: number,
  data: { name: string; description?: string; bodyHtml: string; isDefault?: boolean },
) => {
  if (data.isDefault) {
    await prisma.hrOfferLetterTemplate.updateMany({
      where: { tenantId },
      data: { isDefault: false },
    });
  }
  const row = await prisma.hrOfferLetterTemplate.create({
    data: {
      tenantId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      bodyHtml: data.bodyHtml,
      isDefault: data.isDefault ?? false,
    },
  });
  return mapOfferLetterTemplate(row);
};

export const updateOfferLetterTemplate = async (
  tenantId: number,
  id: string,
  data: { name?: string; description?: string | null; bodyHtml?: string; isDefault?: boolean },
) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Offer template not found');
  const existing = await prisma.hrOfferLetterTemplate.findFirst({
    where: { id: numericId, OR: [{ tenantId }, { tenantId: null }] },
  });
  if (!existing) throw new Error('Offer template not found');
  if (data.isDefault) {
    await prisma.hrOfferLetterTemplate.updateMany({
      where: { tenantId, NOT: { id: numericId } },
      data: { isDefault: false },
    });
  }
  const row = await prisma.hrOfferLetterTemplate.update({
    where: { id: numericId },
    data: {
      ...(data.name != null ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.bodyHtml != null ? { bodyHtml: data.bodyHtml } : {}),
      ...(data.isDefault != null ? { isDefault: data.isDefault } : {}),
    },
  });
  return mapOfferLetterTemplate(row);
};

export const deleteOfferLetterTemplate = async (tenantId: number, id: string) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Offer template not found');
  const existing = await prisma.hrOfferLetterTemplate.findFirst({
    where: { id: numericId, tenantId },
  });
  if (!existing) throw new Error('Offer template not found or not editable');
  await prisma.hrOfferLetterTemplate.delete({ where: { id: numericId } });
  return { id };
};

// Variable substitution. Keep it simple: {{key}} or {{key|fallback}}.
const formatCurrency = (amount: number) =>
  amount.toLocaleString(undefined, { maximumFractionDigits: 0 });

const renderVariables = (body: string, vars: Record<string, string>) =>
  body.replace(/\{\{\s*([a-zA-Z0-9_]+)(?:\s*\|\s*([^}]+))?\s*\}\}/g, (_, key: string, fallback?: string) => {
    const v = vars[key];
    if (v != null && v !== '') return v;
    return fallback?.trim() ?? '';
  });

export const renderOfferLetterHtml = async (
  offerId: string,
  ctx: { tenantId?: number | null; companyName?: string } = {},
) => {
  const numericId = resolveNumericId(offerId);
  if (numericId === null) throw new Error('Offer letter not found');
  const offer = await prisma.hrOfferLetter.findUnique({
    where: { id: numericId },
    include: { template: true, candidate: { include: { job: true } } },
  });
  if (!offer) throw new Error('Offer letter not found');

  // Prefer the explicit template; else the tenant default; else any global default.
  let template = offer.template;
  if (!template) {
    template = await prisma.hrOfferLetterTemplate.findFirst({
      where: { OR: [{ tenantId: ctx.tenantId ?? null }, { tenantId: null }], isDefault: true },
      orderBy: { tenantId: 'desc' },
    });
  }
  if (!template) throw new Error('No offer letter template available');

  let companyName = ctx.companyName;
  if (!companyName && ctx.tenantId != null) {
    const tenant = await prisma.tenant.findUnique({ where: { id: ctx.tenantId }, select: { name: true } });
    companyName = tenant?.name;
  }
  companyName = companyName || 'The Company';

  const variables: Record<string, string> = {
    candidateName: offer.candidateName,
    candidateEmail: offer.candidateEmail,
    jobTitle: offer.jobTitle,
    department: offer.department,
    offeredSalary: formatCurrency(offer.offeredSalary),
    joiningDate: offer.joiningDate,
    expiryDate: offer.expiryDate,
    companyName,
    today: new Date().toLocaleDateString(),
    conditionalClause: offer.conditional
      ? 'This offer is conditional on satisfactory completion of reference and background checks.'
      : 'This offer is unconditional.',
  };

  const html = renderVariables(template.bodyHtml, variables);
  // Persist the rendered snapshot so historical offers remain stable even if
  // the template later changes.
  await prisma.hrOfferLetter.update({
    where: { id: numericId },
    data: { renderedHtml: html, templateId: template.id },
  });
  return { html, template: mapOfferLetterTemplate(template), offer: mapOfferLetter(offer) };
};

// ---------------------------------------------------------------------------
// Onboarding templates
// ---------------------------------------------------------------------------

const onboardingTemplateScope = (tenantId: number | null) =>
  tenantId == null ? {} : { OR: [{ tenantId }, { tenantId: null }] };

export const getOnboardingTemplates = async (tenantId: number | null = null) => {
  const rows = await prisma.hrOnboardingTemplate.findMany({
    where: onboardingTemplateScope(tenantId),
    include: { items: { orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
  return rows.map(mapOnboardingTemplate);
};

export const createOnboardingTemplate = async (
  tenantId: number,
  data: {
    name: string;
    description?: string;
    role?: string;
    isDefault?: boolean;
    items: Array<{
      category: 'DOCUMENTS' | 'ACCESS' | 'TRAINING';
      title: string;
      description?: string;
      dueOffsetDays?: number;
      assigneeRole?: string;
      sortOrder?: number;
    }>;
  },
) => {
  if (data.isDefault) {
    await prisma.hrOnboardingTemplate.updateMany({
      where: { tenantId },
      data: { isDefault: false },
    });
  }
  const row = await prisma.hrOnboardingTemplate.create({
    data: {
      tenantId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      role: data.role?.trim() || null,
      isDefault: data.isDefault ?? false,
      items: {
        create: data.items.map((item, idx) => ({
          category: item.category,
          title: item.title.trim(),
          description: item.description?.trim() || null,
          dueOffsetDays: item.dueOffsetDays ?? 0,
          assigneeRole: item.assigneeRole?.trim() || null,
          sortOrder: item.sortOrder ?? idx,
        })),
      },
    },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });
  return mapOnboardingTemplate(row);
};

export const deleteOnboardingTemplate = async (tenantId: number, id: string) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Onboarding template not found');
  const existing = await prisma.hrOnboardingTemplate.findFirst({
    where: { id: numericId, tenantId },
  });
  if (!existing) throw new Error('Onboarding template not found or not editable');
  await prisma.hrOnboardingTemplate.delete({ where: { id: numericId } });
  return { id };
};

const spawnChecklistFromTemplate = async (
  tx: typeof prisma,
  args: { employeeId: number; employeeName: string; joiningDate: string; templateId?: number | null; tenantId: number | null },
) => {
  let template = args.templateId
    ? await tx.hrOnboardingTemplate.findUnique({
        where: { id: args.templateId },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      })
    : null;
  if (!template) {
    template = await tx.hrOnboardingTemplate.findFirst({
      where: { OR: [{ tenantId: args.tenantId ?? null }, { tenantId: null }], isDefault: true },
      orderBy: { tenantId: 'desc' },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  }
  const joining = new Date(args.joiningDate);
  const computeDue = (offsetDays: number) => {
    if (!Number.isFinite(joining.getTime())) return null;
    const d = new Date(joining);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };
  const items = template?.items?.length
    ? template.items.map((i) => ({
        category: i.category,
        title: i.title,
        description: i.description,
        dueDate: computeDue(i.dueOffsetDays),
        assignee: i.assigneeRole,
        status: 'PENDING' as const,
      }))
    : defaultOnboardingItems().map((i) => ({
        category: i.category,
        title: i.title,
        status: 'PENDING' as const,
      }));

  return tx.hrOnboardingChecklist.create({
    data: {
      employeeId: args.employeeId,
      employeeName: args.employeeName,
      startDate: args.joiningDate,
      status: 'PENDING',
      items: { create: items },
    },
    include: { items: { orderBy: { id: 'asc' } } },
  });
};

export const createOnboardingChecklistFromTemplate = async (
  tenantId: number | null,
  data: { employeeId: string; employeeName: string; startDate: string; templateId?: string },
) => {
  const emp = await resolveEmployeeId(data.employeeId);
  const employeeDbId = emp?.id ?? resolveNumericId(data.employeeId);
  if (!employeeDbId) throw new Error('Employee not found');
  const checklist = await spawnChecklistFromTemplate(prisma, {
    employeeId: employeeDbId,
    employeeName: data.employeeName,
    joiningDate: data.startDate,
    templateId: data.templateId ? resolveNumericId(data.templateId) : null,
    tenantId,
  });
  return mapOnboardingChecklist(checklist);
};

// ---------------------------------------------------------------------------
// Offer ACCEPT side-effects: create employee + spawn onboarding checklist
// ---------------------------------------------------------------------------

export const acceptOfferLetter = async (
  offerId: string,
  ctx: { tenantId: number | null; onboardingTemplateId?: string },
) => {
  const numericId = resolveNumericId(offerId);
  if (numericId === null) throw new Error('Offer letter not found');

  return prisma.$transaction(async (tx) => {
    const offer = await tx.hrOfferLetter.findUnique({
      where: { id: numericId },
      include: { candidate: { include: { job: true } } },
    });
    if (!offer) throw new Error('Offer letter not found');
    if (offer.status === 'ACCEPTED' && offer.employeeId) {
      return {
        offer: mapOfferLetter(offer),
        employeeId: sid(offer.employeeId),
        checklistId: null,
        alreadyAccepted: true,
      };
    }

    // 1. Ensure HrEmployee row for the candidate (idempotent on email).
    let employee = await tx.hrEmployee.findFirst({
      where: { tenantId: ctx.tenantId ?? undefined, email: offer.candidateEmail },
    });
    if (!employee) {
      const baseCode = `EMP-${Date.now().toString().slice(-6)}`;
      const { first, last } = splitName(offer.candidateName);
      employee = await tx.hrEmployee.create({
        data: {
          tenantId: ctx.tenantId ?? undefined,
          name: offer.candidateName,
          firstName: first,
          lastName: last,
          email: offer.candidateEmail,
          phone: offer.candidate?.phone ?? '',
          employeeCode: baseCode,
          designation: offer.jobTitle,
          department: offer.department,
          joiningDate: offer.joiningDate,
          accessRole: 'EMPLOYEE',
          employmentStatus: 'ACTIVE',
        },
      });
    } else {
      employee = await tx.hrEmployee.update({
        where: { id: employee.id },
        data: {
          designation: offer.jobTitle,
          department: offer.department,
          joiningDate: offer.joiningDate,
        },
      });
    }

    // 2. Spawn onboarding checklist from the chosen / default template.
    const templateId = ctx.onboardingTemplateId ? resolveNumericId(ctx.onboardingTemplateId) : null;
    const checklist = await spawnChecklistFromTemplate(tx as unknown as typeof prisma, {
      employeeId: employee.id,
      employeeName: offer.candidateName,
      joiningDate: offer.joiningDate,
      templateId,
      tenantId: ctx.tenantId,
    });

    await linkOfferLetterToEmployee(tx as unknown as typeof prisma, employee.id, ctx.tenantId, offer);

    // 3. Mark offer ACCEPTED, link to employee, set timestamp.
    const updated = await tx.hrOfferLetter.update({
      where: { id: numericId },
      data: { status: 'ACCEPTED', acceptedAt: new Date(), employeeId: employee.id },
    });

    // 4. Move the candidate to HIRED status.
    await tx.hrCandidate.update({
      where: { id: offer.candidateId },
      data: { status: 'HIRED', currentStage: 'hired' },
    });
    await tx.hrCandidateStageEvent.create({
      data: {
        candidateId: offer.candidateId,
        fromStage: offer.candidate?.currentStage ?? null,
        toStage: 'hired',
        notes: 'Offer accepted — candidate hired',
      },
    });

    return {
      offer: mapOfferLetter(updated),
      employeeId: sid(employee.id),
      checklistId: sid(checklist.id),
      alreadyAccepted: false,
    };
  });
};

export const rejectOfferLetter = async (offerId: string, notes?: string) => {
  const numericId = resolveNumericId(offerId);
  if (numericId === null) throw new Error('Offer letter not found');
  return prisma.$transaction(async (tx) => {
    const offer = await tx.hrOfferLetter.findUnique({
      where: { id: numericId },
      include: { candidate: true },
    });
    if (!offer) throw new Error('Offer letter not found');
    const updated = await tx.hrOfferLetter.update({
      where: { id: numericId },
      data: { status: 'REJECTED', rejectedAt: new Date() },
    });
    await tx.hrCandidateStageEvent.create({
      data: {
        candidateId: offer.candidateId,
        fromStage: offer.candidate?.currentStage ?? null,
        toStage: offer.candidate?.currentStage ?? 'offer_rejected',
        notes: notes || 'Offer rejected',
      },
    });
    return mapOfferLetter(updated);
  });
};

// ---------------------------------------------------------------------------
// Candidate stage events
// ---------------------------------------------------------------------------

export const getCandidateStageEvents = async (candidateId: string) => {
  const numericId = resolveNumericId(candidateId);
  if (numericId === null) return [];
  const events = await prisma.hrCandidateStageEvent.findMany({
    where: { candidateId: numericId },
    include: { changedBy: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return events.map(mapCandidateStageEvent);
};

// ---------------------------------------------------------------------------
// 14. Interviews
// ---------------------------------------------------------------------------

export const getInterviews = async () => {
  const rows = await prisma.hrInterview.findMany({ orderBy: { id: 'asc' } });
  return rows.map(mapInterview);
};

export const scheduleInterview = async (data: Omit<Interview, 'id' | 'createdAt' | 'feedback'>) => {
  const candidateId = requireCandidateId(data.candidateId);
  const interview = await prisma.hrInterview.create({
    data: {
      candidateId,
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

export const rescheduleInterview = async (
  id: string,
  data: { scheduledAt: string; meetingLink?: string },
) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Interview not found');
  const interview = await prisma.hrInterview.update({
    where: { id: numericId },
    data: {
      scheduledAt: new Date(data.scheduledAt),
      ...(data.meetingLink !== undefined && { meetingLink: data.meetingLink }),
      status: 'SCHEDULED',
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
  const existing = await prisma.hrInterview.findUnique({ where: { id: numericId } });
  if (!existing) throw new Error('Interview not found');

  const interview = await prisma.hrInterview.update({
    where: { id: numericId },
    data: {
      feedback: { ...feedback, submittedAt: new Date().toISOString() },
      status: 'COMPLETED',
    },
  });

  if (feedback.recommendation === 'NO_HIRE') {
    const candidate = await prisma.hrCandidate.findUnique({ where: { id: existing.candidateId } });
    await updateCandidateStage(
      sid(existing.candidateId),
      candidate?.currentStage ?? 'screening',
      'REJECTED',
      null,
      'Interview feedback: No hire',
    );
  } else if (feedback.recommendation === 'STRONG_HIRE' || feedback.recommendation === 'HIRE') {
    const candidate = await prisma.hrCandidate.findUnique({ where: { id: existing.candidateId } });
    if (candidate && candidate.status === 'ACTIVE') {
      const stages = ['application', 'screening', 'hr_round', 'tech_round', 'manager_round', 'offer_generation', 'onboarding'];
      const idx = stages.indexOf(candidate.currentStage);
      if (idx >= 0 && idx < stages.indexOf('offer_generation')) {
        await updateCandidateStage(sid(candidate.id), 'offer_generation', 'ACTIVE', null, 'Interview feedback: Hire recommendation');
      }
    }
  }

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

export const updateJobPosting = async (
  id: string,
  data: {
    title?: string;
    department?: string;
    location?: string;
    type?: JobPosting['type'];
    description?: string;
    requirements?: string;
    salaryRange?: string;
    hiringManager?: string;
    closingDate?: string | null;
  },
) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Job posting not found');
  const posting = await prisma.hrJobPosting.update({
    where: { id: numericId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.department !== undefined && { department: data.department }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.requirements !== undefined && { requirements: data.requirements }),
      ...(data.salaryRange !== undefined && { salaryRange: data.salaryRange }),
      ...(data.hiringManager !== undefined && { hiringManager: data.hiringManager }),
      ...(data.closingDate !== undefined && { closingDate: data.closingDate }),
    },
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
  if (jobId === null) throw new Error('Job not found');
  const candidate = await prisma.hrCandidate.create({
    data: {
      jobId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      resumeUrl: data.resumeUrl,
      currentStage: data.currentStage,
      status: data.status,
      appliedAt: new Date().toISOString().split('T')[0],
    },
  });
  await prisma.hrCandidateStageEvent.create({
    data: {
      candidateId: candidate.id,
      fromStage: null,
      toStage: data.currentStage,
      notes: 'Candidate added to pipeline',
    },
  });
  return mapCandidate(candidate);
};

export const updateCandidate = async (
  id: string,
  data: { name?: string; phone?: string; resumeUrl?: string | null },
) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Candidate not found');
  const candidate = await prisma.hrCandidate.update({
    where: { id: numericId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.resumeUrl !== undefined && { resumeUrl: data.resumeUrl }),
    },
  });
  return mapCandidate(candidate);
};

export const updateCandidateStatus = async (
  id: string,
  status: Candidate['status'],
  changedById?: number | null,
  notes?: string,
) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Candidate not found');
  const existing = await prisma.hrCandidate.findUnique({ where: { id: numericId } });
  if (!existing) throw new Error('Candidate not found');
  const stage =
    status === 'HIRED' ? 'hired' : status === 'REJECTED' ? existing.currentStage : existing.currentStage;
  return updateCandidateStage(id, stage, status, changedById, notes);
};

export const updateCandidateStage = async (
  id: string,
  stage: string,
  status?: Candidate['status'],
  changedById?: number | null,
  notes?: string,
) => {
  const numericId = resolveNumericId(id);
  if (numericId === null) throw new Error('Candidate not found');
  return prisma.$transaction(async (tx) => {
    const existing = await tx.hrCandidate.findUnique({ where: { id: numericId } });
    if (!existing) throw new Error('Candidate not found');
    const candidate = await tx.hrCandidate.update({
      where: { id: numericId },
      data: {
        currentStage: stage,
        ...(status ? { status } : {}),
      },
    });
    if (existing.currentStage !== stage) {
      await tx.hrCandidateStageEvent.create({
        data: {
          candidateId: numericId,
          fromStage: existing.currentStage,
          toStage: stage,
          changedById: changedById ?? null,
          notes: notes || null,
        },
      });
    }
    return mapCandidate(candidate);
  });
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
// 20b. Counsellor conversion metrics (computed from live CRM lead data)
// ---------------------------------------------------------------------------

const parseMoney = (value?: string | null): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
};

const defaultEnrollmentRevenue = () =>
  Number(process.env.HR_DEFAULT_ENROLLMENT_REVENUE || 25_000);

const defaultIncentivePerEnrollment = () =>
  Number(process.env.HR_INCENTIVE_PER_ENROLLMENT || 5_000);

const defaultIncentiveRevenueShare = () =>
  Number(process.env.HR_INCENTIVE_REVENUE_SHARE || 0.02);

const computeCounsellorRevenue = async (
  counsellorId: number,
  start: Date,
  end: Date
): Promise<number> => {
  const apps = await prisma.application.findMany({
    where: {
      assignedToId: counsellorId,
      stage: 'ENROLLED',
      updatedAt: { gte: start, lte: end },
    },
    select: { university: true, course: true },
  });

  let total = 0;
  for (const app of apps) {
    const course = await prisma.course.findFirst({
      where: {
        name: { equals: app.course, mode: 'insensitive' },
        deletedAt: null,
        university: {
          name: { equals: app.university, mode: 'insensitive' },
          deletedAt: null,
        },
      },
      select: { tuitionFee: true, applicationFee: true },
    });

    if (course) {
      total += parseMoney(course.tuitionFee) + parseMoney(course.applicationFee);
    } else {
      total += defaultEnrollmentRevenue();
    }
  }

  return Math.round(total * 100) / 100;
};

export const computeCounsellorMetricForUser = async (
  counsellor: { id: number; fullName: string | null; email: string },
  period: string
): Promise<CounsellorConversionMetric> => {
  const { start, end } = parseReviewPeriod(period);
  const kpiTarget = await getCounsellorConversionTarget();

  const leadsHandled = await prisma.lead.count({
    where: {
      assignedCounsellorId: counsellor.id,
      deletedAt: null,
      createdAt: { gte: start, lte: end },
    },
  });

  const conversions = await prisma.lead.count({
    where: {
      assignedCounsellorId: counsellor.id,
      deletedAt: null,
      status: 'CONVERTED',
      convertedAt: { gte: start, lte: end },
    },
  });

  const enrollments = await prisma.application.count({
    where: {
      assignedToId: counsellor.id,
      stage: 'ENROLLED',
      updatedAt: { gte: start, lte: end },
    },
  });

  const revenue = await computeCounsellorRevenue(counsellor.id, start, end);
  const conversionRate =
    leadsHandled > 0 ? Math.round((conversions / leadsHandled) * 1000) / 10 : 0;

  return {
    counsellorId: String(counsellor.id),
    counsellorName: counsellor.fullName || counsellor.email,
    period,
    leadsHandled,
    conversions,
    enrollments,
    conversionRate,
    revenue,
    kpiTarget,
    calculatedRating: conversionRateToRating(conversionRate, kpiTarget),
  };
};

export const computePerformanceIncentive = async (
  employeeId: number,
  period: string
): Promise<number> => {
  const emp = await prisma.hrEmployee.findUnique({
    where: { id: employeeId },
    include: { salaryStructure: true },
  });
  if (!emp?.userId) return 0;

  const user = await prisma.user.findUnique({ where: { id: emp.userId } });
  if (!user || user.role !== 'COUNSELLOR') return 0;

  const metric = await computeCounsellorMetricForUser(
    { id: user.id, fullName: user.fullName, email: user.email },
    period
  );

  const perEnrollment =
    emp.salaryStructure?.incentivePerEnrollment || defaultIncentivePerEnrollment();
  const revenueShare =
    emp.salaryStructure?.incentiveRevenueShare || defaultIncentiveRevenueShare();

  const incentive = metric.enrollments * perEnrollment + metric.revenue * revenueShare;
  return Math.round(incentive * 100) / 100;
};

export const conversionRateToRating = (conversionRate: number, target: number): number => {
  if (target <= 0) return 3;
  const ratio = conversionRate / target;
  if (ratio >= 1.2) return 5;
  if (ratio >= 1.0) return 4.5;
  if (ratio >= 0.9) return 4;
  if (ratio >= 0.8) return 3.5;
  if (ratio >= 0.7) return 3;
  if (ratio >= 0.5) return 2.5;
  if (ratio >= 0.3) return 2;
  return 1;
};

const getCounsellorConversionTarget = async (): Promise<number> => {
  const kpi = await prisma.hrKpiDefinition.findFirst({
    where: {
      role: 'COUNSELLOR',
      isActive: true,
      name: { contains: 'Conversion', mode: 'insensitive' },
    },
    orderBy: { id: 'asc' },
  });
  return kpi?.target ?? 40;
};

export const computeCounsellorConversionMetrics = async (
  period: string
): Promise<CounsellorConversionMetric[]> => {
  const counsellors = await prisma.user.findMany({
    where: { role: 'COUNSELLOR', isActive: true },
    select: { id: true, fullName: true, email: true },
    orderBy: { fullName: 'asc' },
  });

  return Promise.all(counsellors.map((c) => computeCounsellorMetricForUser(c, period)));
};

export const syncCounsellorPerformanceFromLeads = async (period: string) => {
  const metrics = await computeCounsellorConversionMetrics(period);
  const synced = [];
  for (const m of metrics) {
    synced.push(
      await addCounsellorPerformance({
        counsellorId: m.counsellorId,
        counsellorName: m.counsellorName,
        period: m.period,
        leadsHandled: m.leadsHandled,
        conversions: m.conversions,
        revenue: m.revenue,
      })
    );
  }
  return synced;
};

export const generatePerformanceReviewsFromConversion = async (opts: {
  period: string;
  cycle?: string;
}) => {
  const { period, cycle } = opts;
  const periodType = detectPeriodType(period);
  const metrics = await computeCounsellorConversionMetrics(period);
  await syncCounsellorPerformanceFromLeads(period);

  const reviewCycle = cycle || formatReviewCycle(period);
  const frequency = periodType === 'weekly' ? 'WEEKLY' : 'MONTHLY';

  const reviews: PerformanceReview[] = [];

  for (const m of metrics) {
    const userId = parseInt(m.counsellorId, 10);
    if (Number.isNaN(userId)) continue;

    const emp = await prisma.hrEmployee.findFirst({
      where: { userId },
      include: { manager: true },
    });
    if (!emp) continue;

    const existing = await prisma.hrPerformanceReview.findFirst({
      where: { employeeId: emp.id, cycle: reviewCycle },
    });

    const data = {
      employeeId: emp.id,
      name: emp.name,
      employeeCode: emp.employeeCode,
      department: emp.department || 'Counselling',
      cycle: reviewCycle,
      manager: emp.manager?.name || 'HR',
      rating: m.calculatedRating,
      status: 'MANAGER_REVIEW' as HrReviewStatus,
      reviewDate: new Date().toISOString().split('T')[0],
      reviewPeriod: period,
      frequency: frequency as 'WEEKLY' | 'MONTHLY',
      leadsHandled: m.leadsHandled,
      conversions: m.conversions,
      enrollments: m.enrollments,
      conversionRate: m.conversionRate,
      revenue: m.revenue,
    };

    const row = existing
      ? await prisma.hrPerformanceReview.update({ where: { id: existing.id }, data })
      : await prisma.hrPerformanceReview.create({ data });

    reviews.push(mapPerformanceReview(row));
  }

  return reviews;
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
  reviewPeriod: r.reviewPeriod ?? undefined,
  frequency: r.frequency,
  leadsHandled: r.leadsHandled,
  conversions: r.conversions,
  enrollments: r.enrollments,
  conversionRate: r.conversionRate,
  revenue: r.revenue,
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
  await syncEmployeeLeaveStatus(row.employeeId);
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
  await syncEmployeeLeaveStatus(row.employeeId);
  return mapLeaveRequest(row);
};

// ---------------------------------------------------------------------------
// HR dashboard summary
// ---------------------------------------------------------------------------

export const getHrMe = async (userId: number, userEmail: string | null | undefined) => {
  const employee = await resolveEmployeeForUser(userId, userEmail);

  const now = new Date();

  if (!employee) {
    return {
      employee: null,
      leaveBalances: [],
      leaveSummary: { totalQuota: 0, totalUsed: 0, totalRemaining: 0, totalPending: 0, pendingRequests: 0 },
      attendanceSummary: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        presentDays: 0,
        lateDays: 0,
        leaveDaysThisYear: 0,
      },
      recentLeaveRequests: [],
      recentPayslips: [],
      pendingRegularizations: 0,
      todayAttendance: null,
    };
  }

  const todayStr = todayDateString();
  const yearStart = `${now.getFullYear()}-01-01`;
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [planAssignment, leaveRequests, payslips, pendingRegs, todayRecord, pendingLeaveRequests, monthAttendance] =
    await Promise.all([
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
      prisma.hrLeaveRequest.findMany({
        where: { employeeId: employee.id, status: 'PENDING' },
      }),
      prisma.hrAttendanceRecord.findMany({
        where: { employeeId: employee.id, date: { startsWith: monthPrefix } },
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

  const pendingByType: Record<string, number> = {};
  for (const req of pendingLeaveRequests) {
    pendingByType[req.leaveTypeName] = (pendingByType[req.leaveTypeName] || 0) + req.days;
  }

  // Prefer the employee's explicit plan assignment; otherwise fall back to the
  // tenant's default leave plan so the user always sees their entitlements
  // (auto-scoped to the active tenant by the Prisma extension).
  let definitions = planAssignment?.plan.definitions ?? [];
  if (definitions.length === 0) {
    const fallbackPlan = await prisma.hrLeavePlan.findFirst({
      orderBy: { id: 'asc' },
      include: { definitions: { include: { leaveType: true } } },
    });
    definitions = fallbackPlan?.definitions ?? [];
  }

  const leaveBalances = definitions.map((def) => {
    const used = usedByType[def.leaveType.name] || 0;
    const pending = pendingByType[def.leaveType.name] || 0;
    const entitled = computeLeaveEntitlement(def, now);
    const remaining = Math.max(0, entitled - used);
    return {
      leaveType: def.leaveType.name,
      annualQuota: def.annualQuota,
      entitled,
      used,
      pending,
      remaining,
      accrualType: def.accrualType,
      accrualRate: def.accrualRate,
      carryForward: def.carryForward,
    };
  });

  const leaveSummary = {
    totalQuota: leaveBalances.reduce((s, b) => s + b.entitled, 0),
    totalUsed: leaveBalances.reduce((s, b) => s + b.used, 0),
    totalRemaining: leaveBalances.reduce((s, b) => s + b.remaining, 0),
    totalPending: leaveBalances.reduce((s, b) => s + b.pending, 0),
    pendingRequests: pendingLeaveRequests.length,
  };

  const attendanceSummary = {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    presentDays: monthAttendance.filter((r) => r.checkIn).length,
    lateDays: monthAttendance.filter((r) => r.status === 'LATE').length,
    leaveDaysThisYear: Object.values(usedByType).reduce((s, v) => s + v, 0),
  };

  return {
    employee: mapEmployee(employee),
    leaveBalances,
    leaveSummary,
    attendanceSummary,
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
  const today = new Date().toISOString().slice(0, 10);
  const ninetyDaysOut = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [
    openJobs,
    candidates,
    pendingLeave,
    pendingRegularizations,
    employeeCount,
    openInterviews,
    upcomingHolidays,
  ] = await Promise.all([
    prisma.hrJobPosting.count({ where: { status: 'OPEN' } }),
    prisma.hrCandidate.count({ where: { status: 'ACTIVE' } }),
    prisma.hrLeaveRequest.count({ where: { status: 'PENDING' } }),
    prisma.hrRegularization.count({ where: { status: 'PENDING' } }),
    prisma.hrEmployee.count(),
    prisma.hrInterview.count({ where: { status: 'SCHEDULED' } }),
    prisma.hrHoliday.findMany({
      where: { date: { gte: today, lte: ninetyDaysOut } },
      orderBy: { date: 'asc' },
      take: 6,
    }),
  ]);

  return {
    openPositions: openJobs,
    candidatesInPipeline: candidates,
    pendingLeaveRequests: pendingLeave,
    pendingRegularizations,
    employeeCount,
    scheduledInterviews: openInterviews,
    upcomingHolidays: upcomingHolidays.map(mapHoliday),
  };
};
