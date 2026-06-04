import crypto from 'crypto';

// In-Memory Data Models
export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  access_role: string;
  department?: string | null;
  designation?: string | null;
  phone?: string | null;
  biometricId?: string | null;
  location?: string | null;
}

export interface Device {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceIp: string;
  status: 'online' | 'offline';
  lastSync: string;
  settings: Record<string, any>;
}

export interface NetworkWhitelist {
  id: string;
  ip_address_or_range: string;
  label: string;
  is_active: boolean;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  device_id: string | null;
}

export interface Regularization {
  id: string;
  employee_id: string;
  name: string;
  date: string;
  type: string;
  time: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approverRemarks?: string;
  createdAt: string;
}

export interface LeavePlan {
  id: string;
  name: string;
  description?: string;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
}

export interface LeaveDefinition {
  plan_id: string;
  leave_type_id: string;
  name: string;
  annual_quota: number;
  carry_forward: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  is_restricted: boolean;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  name: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'DRAFT' | 'PAID';
}

// ----------------------------------------------------
// STATE PRE-SEEDING
// ----------------------------------------------------
let employees: Employee[] = [
  { id: '1', name: 'Raju Kalla', employeeId: 'E001', email: 'raju.kalla@onecrm.com', access_role: 'EMPLOYEE', department: 'Engineering', designation: 'Senior Developer', biometricId: 'E001', location: 'Chicago Office' },
  { id: '2', name: 'Jane Admin', employeeId: 'E002', email: 'jane.admin@onecrm.com', access_role: 'SUPER_ADMIN', department: 'Operations', designation: 'Operations Lead', biometricId: 'E002', location: 'Chicago Office' },
  { id: '3', name: 'Alice Smith', employeeId: 'E003', email: 'alice.smith@onecrm.com', access_role: 'HR_MANAGER', department: 'Human Resources', designation: 'HR Manager', biometricId: 'E003', location: 'New York Office' },
  { id: '4', name: 'Bob Johnson', employeeId: 'E004', email: 'bob.johnson@onecrm.com', access_role: 'PAYROLL_ADMIN', department: 'Finance', designation: 'Payroll Admin', biometricId: 'E004', location: 'New York Office' },
];

let devices: Device[] = [
  { id: 'dev_1', deviceId: '192.168.1.50', deviceName: 'Main Lobby Fingerprint', deviceIp: '192.168.1.50', status: 'online', lastSync: new Date().toISOString(), settings: {} },
  { id: 'dev_2', deviceId: '192.168.1.51', deviceName: 'Server Room Face Recognition', deviceIp: '192.168.1.51', status: 'online', lastSync: new Date().toISOString(), settings: {} }
];

let networks: NetworkWhitelist[] = [
  { id: 'net_1', ip_address_or_range: '192.168.1.0/24', label: 'Office Wi-Fi Range', is_active: true },
  { id: 'net_2', ip_address_or_range: '10.0.0.0/16', label: 'Corporate VPN', is_active: true }
];

let attendanceSettings = {
  attendance_mode: 'biometric',
  enable_ip_validation: true
};

let attendanceRecords: AttendanceRecord[] = [
  { id: 'att_1', employee_id: '1', date: '2026-05-20', check_in: '2026-05-20T09:00:00.000Z', check_out: '2026-05-20T18:00:00.000Z', status: 'PRESENT', device_id: 'dev_1' },
  { id: 'att_2', employee_id: '1', date: '2026-05-21', check_in: '2026-05-21T09:15:00.000Z', check_out: '2026-05-21T18:00:00.000Z', status: 'LATE', device_id: 'dev_1' },
  { id: 'att_3', employee_id: '2', date: '2026-05-20', check_in: '2026-05-20T08:45:00.000Z', check_out: '2026-05-20T17:30:00.000Z', status: 'PRESENT', device_id: 'dev_1' },
  { id: 'att_4', employee_id: '3', date: '2026-05-20', check_in: '2026-05-20T09:05:00.000Z', check_out: '2026-05-20T18:10:00.000Z', status: 'LATE', device_id: 'dev_2' }
];

let regularizations: Regularization[] = [
  { id: 'reg_1', employee_id: '1', name: 'Raju Kalla', date: '2026-05-18', type: 'check-in', time: '09:00', reason: 'Office scanner was disconnected', status: 'PENDING', createdAt: new Date().toISOString() }
];

let leavePlans: LeavePlan[] = [
  { id: 'plan_1', name: 'Standard FTE Leave Plan', description: 'Applicable for all full-time regular employees.' }
];

let leaveTypes: LeaveType[] = [
  { id: 'type_1', name: 'Casual Leave', code: 'CL' },
  { id: 'type_2', name: 'Medical Leave', code: 'ML' },
  { id: 'type_3', name: 'Earned Leave', code: 'EL' }
];

let leaveDefinitions: LeaveDefinition[] = [
  { plan_id: 'plan_1', leave_type_id: 'type_1', name: 'Casual Leave', annual_quota: 12, carry_forward: false },
  { plan_id: 'plan_1', leave_type_id: 'type_2', name: 'Medical Leave', annual_quota: 10, carry_forward: true }
];

let planAssignments = [
  { plan_id: 'plan_1', employee_id: '1' },
  { plan_id: 'plan_1', employee_id: '2' },
  { plan_id: 'plan_1', employee_id: '3' }
];

let holidays: Holiday[] = [
  { id: 'hol_1', name: 'New Year Day', date: '2026-01-01', is_restricted: false },
  { id: 'hol_2', name: 'Independence Day', date: '2026-08-15', is_restricted: false },
  { id: 'hol_3', name: 'Thanksgiving Holiday', date: '2026-11-26', is_restricted: false },
  { id: 'hol_4', name: 'Christmas Day', date: '2026-12-25', is_restricted: false }
];

let salaryStructures: SalaryStructure[] = [
  { id: 'sal_1', employeeId: '1', basicSalary: 4500, allowances: 800, deductions: 300 },
  { id: 'sal_2', employeeId: '2', basicSalary: 6500, allowances: 1200, deductions: 400 },
  { id: 'sal_3', employeeId: '3', basicSalary: 5200, allowances: 900, deductions: 350 },
  { id: 'sal_4', employeeId: '4', basicSalary: 4800, allowances: 850, deductions: 320 }
];

let payslips: Payslip[] = [
  { id: 'pay_1', employeeId: '1', name: 'Raju Kalla', month: 4, year: 2026, basicSalary: 4500, allowances: 800, deductions: 300, netSalary: 5000, status: 'PAID' },
  { id: 'pay_2', employeeId: '2', name: 'Jane Admin', month: 4, year: 2026, basicSalary: 6500, allowances: 1200, deductions: 400, netSalary: 7300, status: 'PAID' }
];

// ----------------------------------------------------
// SERVICE INTERFACES & IMPLEMENTATION
// ----------------------------------------------------

// 1. Employees & Admin Roles
export const getEmployees = async () => {
  return employees;
};

export const getTeam = async () => {
  return employees;
};

export const assignAccessRole = async (employeeId: string, role: string) => {
  const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId);
  if (emp) {
    emp.access_role = role;
    return emp;
  }
  throw new Error('Employee not found');
};

export const bulkImportEmployees = async (rows: Partial<Employee>[]) => {
  let importedCount = 0;
  for (const row of rows) {
    if (!row.name || !row.email || !row.employeeId) continue;
    const exists = employees.some(e => e.email.toLowerCase() === row.email?.toLowerCase() || e.employeeId === row.employeeId);
    if (!exists) {
      employees.push({
        id: crypto.randomUUID(),
        name: row.name,
        employeeId: row.employeeId,
        email: row.email,
        access_role: row.access_role || 'EMPLOYEE',
        department: row.department || 'Operations',
        designation: row.designation || 'Staff Member',
        phone: row.phone || null,
        biometricId: row.biometricId || row.employeeId,
        location: row.location || 'HQ Office'
      });
      importedCount++;
    }
  }
  return { success: true, count: importedCount };
};

// 2. Attendance Settings
export const getAttendanceSettings = async () => {
  return attendanceSettings;
};

export const updateAttendanceSettings = async (data: Partial<typeof attendanceSettings>) => {
  attendanceSettings = { ...attendanceSettings, ...data };
  return attendanceSettings;
};

// 3. Device Whitelists
export const getDevices = async () => {
  return devices;
};

export const createDevice = async (device: any) => {
  const newDevice: Device = {
    id: 'dev_' + crypto.randomBytes(4).toString('hex'),
    deviceId: device.device_id || device.deviceId || device.device_ip || device.deviceIp || '',
    deviceName: device.device_name || device.deviceName || '',
    deviceIp: device.device_ip || device.deviceIp || '',
    status: 'online',
    lastSync: new Date().toISOString(),
    settings: {}
  };
  devices.push(newDevice);
  return newDevice;
};

export const deleteDevice = async (id: string) => {
  devices = devices.filter(d => d.id !== id && d.deviceId !== id && d.deviceIp !== id);
  return { success: true };
};

// 4. IP Networks Whitelist
export const getNetworks = async () => {
  return networks;
};

export const createNetwork = async (net: Omit<NetworkWhitelist, 'id'>) => {
  const newNet: NetworkWhitelist = {
    id: 'net_' + crypto.randomBytes(4).toString('hex'),
    ip_address_or_range: net.ip_address_or_range,
    label: net.label,
    is_active: net.is_active !== undefined ? net.is_active : true
  };
  networks.push(newNet);
  return newNet;
};

export const deleteNetwork = async (id: string) => {
  networks = networks.filter(n => n.id !== id);
  return { success: true };
};

// 5. Biometric Users list simulator
export const getBiometricUsers = async (ip: string) => {
  return [
    { emp_id: 'E001', name: 'Raju Kalla', enrolled: true, lastMatch: new Date().toISOString() },
    { emp_id: 'E002', name: 'Jane Admin', enrolled: true, lastMatch: new Date().toISOString() },
    { emp_id: 'E003', name: 'Alice Smith', enrolled: true, lastMatch: new Date().toISOString() },
    { emp_id: 'E004', name: 'Bob Johnson', enrolled: false, lastMatch: null }
  ];
};

// 6. Attendance Events / Log Processor
export const getAttendanceEvents = async () => {
  return attendanceRecords.map(r => {
    const emp = employees.find(e => e.id === r.employee_id);
    return {
      ...r,
      employeeName: emp?.name || 'Unknown Employee',
      employeeId: emp?.employeeId || ''
    };
  });
};

export const processBiometricLogs = async () => {
  // Simulate polling hardware
  const logsToProcess = [
    { employee_id: '1', time: new Date().toISOString(), type: 'check-in', device: 'dev_1' },
    { employee_id: '4', time: new Date().toISOString(), type: 'check-in', device: 'dev_2' }
  ];

  for (const log of logsToProcess) {
    const dateStr = log.time.split('T')[0];
    const hours = new Date(log.time).getHours();
    const status = hours >= 9 ? 'LATE' : 'PRESENT';

    const existing = attendanceRecords.find(r => r.employee_id === log.employee_id && r.date === dateStr);
    if (!existing) {
      attendanceRecords.push({
        id: 'att_' + crypto.randomBytes(4).toString('hex'),
        employee_id: log.employee_id,
        date: dateStr,
        check_in: log.time,
        check_out: null,
        status: status as any,
        device_id: log.device
      });
    }
  }
  return { success: true, processed: logsToProcess.length };
};

export const submitRemoteClockIn = async (employeeId: string, data: { ip: string; coordinates?: string; isCheckOut?: boolean }) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const nowStr = new Date().toISOString();
  
  // Find employee by email or employee_id
  const emp = employees.find(e => e.email === employeeId || e.employeeId === employeeId || e.id === employeeId) || employees[0];
  
  const existing = attendanceRecords.find(r => r.employee_id === emp.id && r.date === dateStr);
  
  if (existing) {
    if (data.isCheckOut) {
      existing.check_out = nowStr;
    } else {
      existing.check_in = nowStr;
    }
    return existing;
  } else {
    const newRecord: AttendanceRecord = {
      id: 'att_' + crypto.randomBytes(4).toString('hex'),
      employee_id: emp.id,
      date: dateStr,
      check_in: data.isCheckOut ? null : nowStr,
      check_out: data.isCheckOut ? nowStr : null,
      status: new Date().getHours() >= 9 ? 'LATE' : 'PRESENT',
      device_id: 'remote_clockin'
    };
    attendanceRecords.push(newRecord);
    return newRecord;
  }
};

// 7. Team Calendar Grid Generator
export const getTeamCalendar = async (month: number, year: number) => {
  // Construct calendar grid responses for all employees
  return employees.map(emp => {
    const records = attendanceRecords.filter(r => r.employee_id === emp.id);
    return {
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department,
      records: records.map(r => ({
        date: r.date,
        check_in: r.check_in,
        check_out: r.check_out,
        status: r.status
      }))
    };
  });
};

// 8. Regularizations
export const getRegularizations = async () => {
  return regularizations;
};

export const requestRegularization = async (employeeId: string, data: any) => {
  const emp = employees.find(e => e.email === employeeId || e.id === employeeId) || employees[0];
  const newReg: Regularization = {
    id: 'reg_' + crypto.randomBytes(4).toString('hex'),
    employee_id: emp.id,
    name: emp.name,
    date: data.date,
    type: data.type,
    time: data.time,
    reason: data.reason,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
  regularizations.push(newReg);
  return newReg;
};

export const processRegularization = async (id: string, status: 'APPROVED' | 'REJECTED', remarks?: string) => {
  const reg = regularizations.find(r => r.id === id);
  if (reg) {
    reg.status = status;
    reg.approverRemarks = remarks || 'Processed by Administrator';

    if (status === 'APPROVED') {
      // Upsert into attendanceRecords
      const dateStr = reg.date;
      const existing = attendanceRecords.find(r => r.employee_id === reg.employee_id && r.date === dateStr);
      
      const hours = parseInt(reg.time.split(':')[0]);
      const statusAtt = hours >= 9 ? 'LATE' : 'PRESENT';

      if (existing) {
        if (reg.type === 'check-in') {
          existing.check_in = `${dateStr}T${reg.time}:00.000Z`;
        } else {
          existing.check_out = `${dateStr}T${reg.time}:00.000Z`;
        }
      } else {
        attendanceRecords.push({
          id: 'att_' + crypto.randomBytes(4).toString('hex'),
          employee_id: reg.employee_id,
          date: dateStr,
          check_in: reg.type === 'check-in' ? `${dateStr}T${reg.time}:00.000Z` : null,
          check_out: reg.type === 'check-out' ? `${dateStr}T${reg.time}:00.000Z` : null,
          status: statusAtt as any,
          device_id: 'regularized'
        });
      }
    }
    return reg;
  }
  throw new Error('Regularization request not found');
};

// 9. Leave Management & Policy
export const getLeavePlans = async () => {
  return leavePlans;
};

export const createLeavePlan = async (plan: { name: string; description?: string }) => {
  const newPlan: LeavePlan = {
    id: 'plan_' + crypto.randomBytes(4).toString('hex'),
    name: plan.name,
    description: plan.description
  };
  leavePlans.push(newPlan);
  return newPlan;
};

export const getLeaveTypes = async () => {
  return leaveTypes;
};

export const getLeaveDefinitions = async (planId: string) => {
  return leaveDefinitions.filter(d => d.plan_id === planId);
};

export const addLeaveDefinition = async (planId: string, data: { leaveTypeId: string; annual_quota: number; carry_forward?: boolean }) => {
  const lt = leaveTypes.find(t => t.id === data.leaveTypeId || t.name === data.leaveTypeId);
  if (!lt) throw new Error('Leave type not found');

  // Check if exists
  const existingIdx = leaveDefinitions.findIndex(d => d.plan_id === planId && d.leave_type_id === lt.id);
  const def = {
    plan_id: planId,
    leave_type_id: lt.id,
    name: lt.name,
    annual_quota: data.annual_quota || 10,
    carry_forward: data.carry_forward || false
  };

  if (existingIdx >= 0) {
    leaveDefinitions[existingIdx] = def;
  } else {
    leaveDefinitions.push(def);
  }
  return def;
};

export const deleteLeaveDefinition = async (planId: string, leaveTypeId: string) => {
  leaveDefinitions = leaveDefinitions.filter(d => !(d.plan_id === planId && d.leave_type_id === leaveTypeId));
  return { success: true };
};

export const getLeavePlanEmployees = async (planId: string) => {
  const empIds = planAssignments.filter(a => a.plan_id === planId).map(a => a.employee_id);
  return employees.filter(e => empIds.includes(e.id));
};

export const assignLeavePlanEmployees = async (planId: string, employeeIds: string[]) => {
  // Clear old assignments for these employees
  planAssignments = planAssignments.filter(a => !employeeIds.includes(a.employee_id));
  
  // Assign new ones
  for (const empId of employeeIds) {
    planAssignments.push({ plan_id: planId, employee_id: empId });
  }
  return { success: true };
};

// 10. Holidays Management
export const getHolidays = async () => {
  return holidays;
};

export const createHoliday = async (hol: Omit<Holiday, 'id'>) => {
  const newHol: Holiday = {
    id: 'hol_' + crypto.randomBytes(4).toString('hex'),
    name: hol.name,
    date: hol.date,
    is_restricted: hol.is_restricted || false
  };
  holidays.push(newHol);
  return newHol;
};

export const deleteHoliday = async (id: string) => {
  holidays = holidays.filter(h => h.id !== id && h.name !== id && h.date !== id);
  return { success: true };
};

// 11. Salary Structures & Payroll Payslips
export const getSalaryStructures = async () => {
  return salaryStructures.map(s => {
    const emp = employees.find(e => e.id === s.employeeId || e.employeeId === s.employeeId);
    return {
      ...s,
      name: emp?.name || 'Unknown',
      email: emp?.email || ''
    };
  });
};

export const updateSalaryStructure = async (data: Omit<SalaryStructure, 'id'>) => {
  const existingIdx = salaryStructures.findIndex(s => s.employeeId === data.employeeId);
  const struct: SalaryStructure = {
    id: existingIdx >= 0 ? salaryStructures[existingIdx].id : 'sal_' + crypto.randomBytes(4).toString('hex'),
    employeeId: data.employeeId,
    basicSalary: Number(data.basicSalary),
    allowances: Number(data.allowances),
    deductions: Number(data.deductions)
  };

  if (existingIdx >= 0) {
    salaryStructures[existingIdx] = struct;
  } else {
    salaryStructures.push(struct);
  }
  return struct;
};

export const getPayslips = async () => {
  return payslips;
};

export const calculatePayroll = async (month: number, year: number) => {
  const computedList: Payslip[] = [];

  for (const struct of salaryStructures) {
    const emp = employees.find(e => e.id === struct.employeeId || e.employeeId === struct.employeeId);
    if (!emp) continue;

    const exists = payslips.some(p => p.employeeId === struct.employeeId && p.month === month && p.year === year);
    if (!exists) {
      // Apply leave and tax deductions
      const deduction = payrollDeductions.find(d => d.employeeId === struct.employeeId && d.month === month && d.year === year);
      const totalDeductions = struct.deductions + (deduction?.leaveDeduction ?? 0) + (deduction?.taxAmount ?? 0) + (deduction?.otherDeductions ?? 0);
      const netSalary = struct.basicSalary + struct.allowances - totalDeductions;
      const newPay: Payslip = {
        id: 'pay_' + crypto.randomBytes(4).toString('hex'),
        employeeId: struct.employeeId,
        name: emp.name,
        month,
        year,
        basicSalary: struct.basicSalary,
        allowances: struct.allowances,
        deductions: totalDeductions,
        netSalary,
        status: 'PAID'
      };
      payslips.push(newPay);
      computedList.push(newPay);
    }
  }

  return computedList;
};

// ============================================================
// NEW SPRINT FEATURES
// ============================================================

// ---- Interfaces ----

export interface OnboardingItem {
  id: string;
  category: 'DOCUMENTS' | 'ACCESS' | 'TRAINING';
  title: string;
  description?: string;
  status: 'PENDING' | 'COMPLETED';
  completedAt?: string;
  completedBy?: string;
}

export interface OnboardingChecklist {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  items: OnboardingItem[];
  createdAt: string;
}

export interface OfferLetter {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  offeredSalary: number;
  joiningDate: string;
  expiryDate: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  policyTemplate: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewFeedback {
  rating: number;
  technicalScore?: number;
  communicationScore?: number;
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'MAYBE' | 'NO_HIRE';
  notes: string;
  submittedBy: string;
  submittedAt: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  round: string;
  type: 'IN_PERSON' | 'VIRTUAL' | 'PHONE';
  scheduledAt: string;
  duration: number;
  interviewers: string[];
  meetingLink?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  feedback?: InterviewFeedback;
  createdAt: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  description: string;
  requirements: string;
  salaryRange: string;
  status: 'DRAFT' | 'OPEN' | 'PAUSED' | 'CLOSED';
  applicantsCount: number;
  hiringManager: string;
  postedAt?: string;
  closingDate?: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl?: string;
  currentStage: string;
  status: 'ACTIVE' | 'REJECTED' | 'HIRED' | 'WITHDRAWN';
  appliedAt: string;
}

export interface ProcessingMetric {
  id: string;
  period: string;
  totalApplications: number;
  processedApplications: number;
  accurateApplications: number;
  avgTurnaroundDays: number;
  reviewsCompleted: number;
  pendingReviews: number;
}

export interface KPIDefinition {
  id: string;
  role: string;
  name: string;
  description?: string;
  target: number;
  unit: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  isActive: boolean;
}

export interface KPIMetric {
  id: string;
  kpiId: string;
  userId?: string;
  userRole: string;
  period: string;
  actualValue: number;
  targetValue: number;
  notes?: string;
  recordedAt: string;
}

export interface MarketingPerformance {
  id: string;
  period: string;
  leadsGenerated: number;
  costPerLead: number;
  totalBudget: number;
  channel: string;
  conversions: number;
}

export interface CounsellorPerformance {
  id: string;
  counsellorId: string;
  counsellorName: string;
  period: string;
  leadsHandled: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

export interface PayrollDeduction {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  leaveDays: number;
  leaveDeduction: number;
  taxAmount: number;
  otherDeductions: number;
  totalDeductions: number;
}

// ---- In-Memory Data ----

let onboardingChecklists: OnboardingChecklist[] = [
  {
    id: 'onb_1', employeeId: '1', employeeName: 'Raju Kalla', startDate: '2026-06-01', status: 'IN_PROGRESS', createdAt: new Date().toISOString(),
    items: [
      { id: 'oi_1', category: 'DOCUMENTS', title: 'Offer Letter Signed', status: 'COMPLETED', completedAt: '2026-06-01T10:00:00Z', completedBy: 'HR Manager' },
      { id: 'oi_2', category: 'DOCUMENTS', title: 'ID Proof Submitted', status: 'COMPLETED', completedAt: '2026-06-01T10:30:00Z', completedBy: 'HR Manager' },
      { id: 'oi_3', category: 'DOCUMENTS', title: 'Bank Details Form', status: 'PENDING' },
      { id: 'oi_4', category: 'ACCESS', title: 'Email Account Created', status: 'COMPLETED', completedAt: '2026-06-02T09:00:00Z', completedBy: 'IT Admin' },
      { id: 'oi_5', category: 'ACCESS', title: 'HRMS Access Granted', status: 'PENDING' },
      { id: 'oi_6', category: 'TRAINING', title: 'Orientation Session', status: 'PENDING' },
      { id: 'oi_7', category: 'TRAINING', title: 'Compliance Training', status: 'PENDING' },
    ]
  }
];

let offerLetters: OfferLetter[] = [
  {
    id: 'off_1', candidateId: 'cand_1', candidateName: 'David Lee', candidateEmail: 'david.lee@email.com',
    jobTitle: 'Senior Developer', department: 'Engineering', offeredSalary: 1800000,
    joiningDate: '2026-07-01', expiryDate: '2026-06-20', status: 'SENT',
    policyTemplate: 'standard', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    id: 'off_2', candidateId: 'cand_2', candidateName: 'Sara Chen', candidateEmail: 'sara.chen@email.com',
    jobTitle: 'Product Manager', department: 'Product', offeredSalary: 2200000,
    joiningDate: '2026-07-15', expiryDate: '2026-06-25', status: 'ACCEPTED',
    policyTemplate: 'senior', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  }
];

let interviews: Interview[] = [
  {
    id: 'int_1', candidateId: 'cand_1', candidateName: 'David Lee', jobTitle: 'Senior Developer',
    round: 'Technical Round', type: 'VIRTUAL', scheduledAt: '2026-06-10T10:00:00Z', duration: 60,
    interviewers: ['Alice Smith', 'Raju Kalla'], meetingLink: 'https://meet.example.com/abc123',
    status: 'SCHEDULED', createdAt: new Date().toISOString()
  },
  {
    id: 'int_2', candidateId: 'cand_2', candidateName: 'Sara Chen', jobTitle: 'Product Manager',
    round: 'HR Round', type: 'IN_PERSON', scheduledAt: '2026-06-08T14:00:00Z', duration: 45,
    interviewers: ['Jane Admin'], status: 'COMPLETED', createdAt: new Date().toISOString(),
    feedback: { rating: 5, technicalScore: 90, communicationScore: 95, recommendation: 'STRONG_HIRE', notes: 'Excellent candidate', submittedBy: 'Jane Admin', submittedAt: new Date().toISOString() }
  }
];

let jobPostings: JobPosting[] = [
  {
    id: 'job_1', title: 'Senior Developer', department: 'Engineering', location: 'Chicago Office',
    type: 'FULL_TIME', description: 'Build scalable web applications using React and Node.js.',
    requirements: '5+ years experience, React, Node.js, PostgreSQL', salaryRange: '18,00,000 - 24,00,000',
    status: 'OPEN', applicantsCount: 12, hiringManager: 'Alice Smith',
    postedAt: '2026-05-15', closingDate: '2026-06-30', createdAt: new Date().toISOString()
  },
  {
    id: 'job_2', title: 'Product Manager', department: 'Product', location: 'Remote',
    type: 'FULL_TIME', description: 'Lead product strategy and roadmap for our CRM platform.',
    requirements: '4+ years PM experience, B2B SaaS background', salaryRange: '22,00,000 - 28,00,000',
    status: 'OPEN', applicantsCount: 8, hiringManager: 'Jane Admin',
    postedAt: '2026-05-20', closingDate: '2026-06-25', createdAt: new Date().toISOString()
  }
];

let candidates: Candidate[] = [
  { id: 'cand_1', jobId: 'job_1', name: 'David Lee', email: 'david.lee@email.com', phone: '+1-555-0101', currentStage: 'offer_generation', status: 'ACTIVE', appliedAt: '2026-05-25' },
  { id: 'cand_2', jobId: 'job_2', name: 'Sara Chen', email: 'sara.chen@email.com', phone: '+1-555-0102', currentStage: 'onboarding', status: 'ACTIVE', appliedAt: '2026-05-22' },
  { id: 'cand_3', jobId: 'job_1', name: 'Mike Brown', email: 'mike.brown@email.com', phone: '+1-555-0103', currentStage: 'screening', status: 'ACTIVE', appliedAt: '2026-05-28' }
];

let processingMetrics: ProcessingMetric[] = [
  { id: 'pm_1', period: '2026-05', totalApplications: 45, processedApplications: 42, accurateApplications: 39, avgTurnaroundDays: 3.2, reviewsCompleted: 38, pendingReviews: 7 },
  { id: 'pm_2', period: '2026-04', totalApplications: 38, processedApplications: 36, accurateApplications: 34, avgTurnaroundDays: 3.8, reviewsCompleted: 34, pendingReviews: 4 }
];

let kpiDefinitions: KPIDefinition[] = [
  { id: 'kpi_1', role: 'HR', name: 'Time to Fill', description: 'Average days to fill an open position', target: 30, unit: 'days', frequency: 'MONTHLY', isActive: true },
  { id: 'kpi_2', role: 'HR', name: 'Offer Acceptance Rate', description: 'Percentage of offers accepted', target: 80, unit: '%', frequency: 'MONTHLY', isActive: true },
  { id: 'kpi_3', role: 'COUNSELLOR', name: 'Lead Conversion Rate', description: 'Percentage of leads converted to students', target: 40, unit: '%', frequency: 'MONTHLY', isActive: true },
  { id: 'kpi_4', role: 'COUNSELLOR', name: 'Revenue Generated', description: 'Total revenue from student enrolments', target: 500000, unit: 'INR', frequency: 'MONTHLY', isActive: true },
  { id: 'kpi_5', role: 'MARKETING', name: 'Leads Generated', description: 'Total number of leads generated', target: 200, unit: 'count', frequency: 'MONTHLY', isActive: true },
  { id: 'kpi_6', role: 'MARKETING', name: 'Cost Per Lead', description: 'Average cost to acquire one lead', target: 500, unit: 'INR', frequency: 'MONTHLY', isActive: true },
];

let kpiMetrics: KPIMetric[] = [
  { id: 'km_1', kpiId: 'kpi_1', userRole: 'HR', period: '2026-05', actualValue: 28, targetValue: 30, recordedAt: new Date().toISOString() },
  { id: 'km_2', kpiId: 'kpi_2', userRole: 'HR', period: '2026-05', actualValue: 85, targetValue: 80, recordedAt: new Date().toISOString() },
  { id: 'km_3', kpiId: 'kpi_5', userRole: 'MARKETING', period: '2026-05', actualValue: 178, targetValue: 200, recordedAt: new Date().toISOString() },
  { id: 'km_4', kpiId: 'kpi_6', userRole: 'MARKETING', period: '2026-05', actualValue: 545, targetValue: 500, recordedAt: new Date().toISOString() },
];

let marketingPerformance: MarketingPerformance[] = [
  { id: 'mp_1', period: '2026-05', leadsGenerated: 178, costPerLead: 545, totalBudget: 97010, channel: 'Google Ads', conversions: 42 },
  { id: 'mp_2', period: '2026-05', leadsGenerated: 92, costPerLead: 320, totalBudget: 29440, channel: 'Meta Ads', conversions: 31 },
  { id: 'mp_3', period: '2026-04', leadsGenerated: 155, costPerLead: 590, totalBudget: 91450, channel: 'Google Ads', conversions: 38 }
];

let counsellorPerformance: CounsellorPerformance[] = [
  { id: 'cp_1', counsellorId: 'u_1', counsellorName: 'Raju Kalla', period: '2026-05', leadsHandled: 45, conversions: 18, revenue: 720000, conversionRate: 40 },
  { id: 'cp_2', counsellorId: 'u_2', counsellorName: 'Jane Admin', period: '2026-05', leadsHandled: 38, conversions: 20, revenue: 850000, conversionRate: 52.6 },
  { id: 'cp_3', counsellorId: 'u_3', counsellorName: 'Alice Smith', period: '2026-05', leadsHandled: 52, conversions: 17, revenue: 680000, conversionRate: 32.7 }
];

let payrollDeductions: PayrollDeduction[] = [
  { id: 'pd_1', employeeId: '1', month: 5, year: 2026, leaveDays: 2, leaveDeduction: 300, taxAmount: 450, otherDeductions: 50, totalDeductions: 800 },
  { id: 'pd_2', employeeId: '2', month: 5, year: 2026, leaveDays: 0, leaveDeduction: 0, taxAmount: 1200, otherDeductions: 0, totalDeductions: 1200 }
];

// ---- Service Functions ----

// 12. Onboarding Checklist
export const getOnboardingChecklists = async () => {
  return onboardingChecklists;
};

export const getOnboardingChecklist = async (id: string) => {
  const checklist = onboardingChecklists.find(c => c.id === id || c.employeeId === id);
  if (!checklist) throw new Error('Checklist not found');
  return checklist;
};

export const createOnboardingChecklist = async (data: { employeeId: string; employeeName: string; startDate: string }) => {
  const defaultItems: OnboardingItem[] = [
    { id: crypto.randomUUID(), category: 'DOCUMENTS', title: 'Offer Letter Signed', status: 'PENDING' },
    { id: crypto.randomUUID(), category: 'DOCUMENTS', title: 'ID Proof Submitted', status: 'PENDING' },
    { id: crypto.randomUUID(), category: 'DOCUMENTS', title: 'Bank Details Form', status: 'PENDING' },
    { id: crypto.randomUUID(), category: 'DOCUMENTS', title: 'Educational Certificates', status: 'PENDING' },
    { id: crypto.randomUUID(), category: 'ACCESS', title: 'Email Account Created', status: 'PENDING' },
    { id: crypto.randomUUID(), category: 'ACCESS', title: 'HRMS Access Granted', status: 'PENDING' },
    { id: crypto.randomUUID(), category: 'ACCESS', title: 'System Access Configured', status: 'PENDING' },
    { id: crypto.randomUUID(), category: 'TRAINING', title: 'Orientation Session', status: 'PENDING' },
    { id: crypto.randomUUID(), category: 'TRAINING', title: 'Compliance Training', status: 'PENDING' },
    { id: crypto.randomUUID(), category: 'TRAINING', title: 'Role-specific Training', status: 'PENDING' },
  ];
  const checklist: OnboardingChecklist = {
    id: 'onb_' + crypto.randomBytes(4).toString('hex'),
    employeeId: data.employeeId,
    employeeName: data.employeeName,
    startDate: data.startDate,
    status: 'PENDING',
    items: defaultItems,
    createdAt: new Date().toISOString()
  };
  onboardingChecklists.push(checklist);
  return checklist;
};

export const updateOnboardingItem = async (checklistId: string, itemId: string, data: { status: 'PENDING' | 'COMPLETED'; completedBy?: string }) => {
  const checklist = onboardingChecklists.find(c => c.id === checklistId);
  if (!checklist) throw new Error('Checklist not found');
  const item = checklist.items.find(i => i.id === itemId);
  if (!item) throw new Error('Item not found');
  item.status = data.status;
  if (data.status === 'COMPLETED') {
    item.completedAt = new Date().toISOString();
    item.completedBy = data.completedBy || 'HR Manager';
  } else {
    item.completedAt = undefined;
    item.completedBy = undefined;
  }
  const allDone = checklist.items.every(i => i.status === 'COMPLETED');
  const anyDone = checklist.items.some(i => i.status === 'COMPLETED');
  checklist.status = allDone ? 'COMPLETED' : anyDone ? 'IN_PROGRESS' : 'PENDING';
  return checklist;
};

// 13. Offer Letters
export const getOfferLetters = async () => {
  return offerLetters;
};

export const createOfferLetter = async (data: Omit<OfferLetter, 'id' | 'createdAt' | 'updatedAt'>) => {
  const letter: OfferLetter = {
    ...data,
    id: 'off_' + crypto.randomBytes(4).toString('hex'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  offerLetters.push(letter);
  return letter;
};

export const updateOfferLetterStatus = async (id: string, status: OfferLetter['status']) => {
  const letter = offerLetters.find(o => o.id === id);
  if (!letter) throw new Error('Offer letter not found');
  letter.status = status;
  letter.updatedAt = new Date().toISOString();
  return letter;
};

// 14. Interviews
export const getInterviews = async () => {
  return interviews;
};

export const scheduleInterview = async (data: Omit<Interview, 'id' | 'createdAt' | 'feedback'>) => {
  const interview: Interview = {
    ...data,
    id: 'int_' + crypto.randomBytes(4).toString('hex'),
    createdAt: new Date().toISOString()
  };
  interviews.push(interview);
  return interview;
};

export const updateInterviewStatus = async (id: string, status: Interview['status']) => {
  const interview = interviews.find(i => i.id === id);
  if (!interview) throw new Error('Interview not found');
  interview.status = status;
  return interview;
};

export const submitInterviewFeedback = async (id: string, feedback: InterviewFeedback) => {
  const interview = interviews.find(i => i.id === id);
  if (!interview) throw new Error('Interview not found');
  interview.feedback = { ...feedback, submittedAt: new Date().toISOString() };
  interview.status = 'COMPLETED';
  return interview;
};

// 15. Job Postings & Candidates
export const getJobPostings = async () => {
  return jobPostings.map(job => ({
    ...job,
    applicantsCount: candidates.filter(c => c.jobId === job.id).length
  }));
};

export const createJobPosting = async (data: Omit<JobPosting, 'id' | 'applicantsCount' | 'createdAt'>) => {
  const posting: JobPosting = {
    ...data,
    id: 'job_' + crypto.randomBytes(4).toString('hex'),
    applicantsCount: 0,
    createdAt: new Date().toISOString()
  };
  jobPostings.push(posting);
  return posting;
};

export const updateJobPostingStatus = async (id: string, status: JobPosting['status']) => {
  const posting = jobPostings.find(j => j.id === id);
  if (!posting) throw new Error('Job posting not found');
  posting.status = status;
  return posting;
};

export const getCandidates = async (jobId?: string) => {
  if (jobId) return candidates.filter(c => c.jobId === jobId);
  return candidates;
};

export const addCandidate = async (data: Omit<Candidate, 'id' | 'appliedAt'>) => {
  const candidate: Candidate = {
    ...data,
    id: 'cand_' + crypto.randomBytes(4).toString('hex'),
    appliedAt: new Date().toISOString().split('T')[0]
  };
  candidates.push(candidate);
  return candidate;
};

export const updateCandidateStage = async (id: string, stage: string, status?: Candidate['status']) => {
  const candidate = candidates.find(c => c.id === id);
  if (!candidate) throw new Error('Candidate not found');
  candidate.currentStage = stage;
  if (status) candidate.status = status;
  return candidate;
};

// 16. Processing Performance Metrics
export const getProcessingMetrics = async () => {
  return processingMetrics;
};

export const addProcessingMetric = async (data: Omit<ProcessingMetric, 'id'>) => {
  const existing = processingMetrics.find(m => m.period === data.period);
  if (existing) {
    Object.assign(existing, data);
    return existing;
  }
  const metric: ProcessingMetric = { ...data, id: 'pm_' + crypto.randomBytes(4).toString('hex') };
  processingMetrics.push(metric);
  return metric;
};

// 17. KPI Definitions
export const getKPIDefinitions = async (role?: string) => {
  if (role) return kpiDefinitions.filter(k => k.role === role.toUpperCase());
  return kpiDefinitions;
};

export const createKPIDefinition = async (data: Omit<KPIDefinition, 'id'>) => {
  const def: KPIDefinition = { ...data, id: 'kpi_' + crypto.randomBytes(4).toString('hex') };
  kpiDefinitions.push(def);
  return def;
};

export const updateKPIDefinition = async (id: string, data: Partial<KPIDefinition>) => {
  const def = kpiDefinitions.find(k => k.id === id);
  if (!def) throw new Error('KPI definition not found');
  Object.assign(def, data);
  return def;
};

export const deleteKPIDefinition = async (id: string) => {
  kpiDefinitions = kpiDefinitions.filter(k => k.id !== id);
  return { success: true };
};

// 18. KPI Metrics
export const getKPIMetrics = async (role?: string, period?: string) => {
  let result = kpiMetrics;
  if (role) result = result.filter(m => m.userRole === role.toUpperCase());
  if (period) result = result.filter(m => m.period === period);
  return result.map(m => {
    const def = kpiDefinitions.find(k => k.id === m.kpiId);
    return { ...m, kpiName: def?.name, unit: def?.unit };
  });
};

export const recordKPIMetric = async (data: Omit<KPIMetric, 'id' | 'recordedAt'>) => {
  const existing = kpiMetrics.find(m => m.kpiId === data.kpiId && m.period === data.period && m.userId === data.userId);
  if (existing) {
    Object.assign(existing, data);
    return existing;
  }
  const metric: KPIMetric = { ...data, id: 'km_' + crypto.randomBytes(4).toString('hex'), recordedAt: new Date().toISOString() };
  kpiMetrics.push(metric);
  return metric;
};

// 19. Marketing Performance
export const getMarketingPerformance = async (period?: string) => {
  if (period) return marketingPerformance.filter(m => m.period === period);
  return marketingPerformance;
};

export const addMarketingPerformance = async (data: Omit<MarketingPerformance, 'id'>) => {
  const record: MarketingPerformance = { ...data, id: 'mp_' + crypto.randomBytes(4).toString('hex') };
  marketingPerformance.push(record);
  return record;
};

// 20. Counsellor Performance
export const getCounsellorPerformance = async (period?: string) => {
  if (period) return counsellorPerformance.filter(c => c.period === period);
  return counsellorPerformance;
};

export const addCounsellorPerformance = async (data: Omit<CounsellorPerformance, 'id' | 'conversionRate'>) => {
  const existing = counsellorPerformance.find(c => c.counsellorId === data.counsellorId && c.period === data.period);
  if (existing) {
    Object.assign(existing, { ...data, conversionRate: data.leadsHandled > 0 ? Math.round((data.conversions / data.leadsHandled) * 1000) / 10 : 0 });
    return existing;
  }
  const record: CounsellorPerformance = {
    ...data,
    id: 'cp_' + crypto.randomBytes(4).toString('hex'),
    conversionRate: data.leadsHandled > 0 ? Math.round((data.conversions / data.leadsHandled) * 1000) / 10 : 0
  };
  counsellorPerformance.push(record);
  return record;
};

// 21. Payroll Deductions
export const getPayrollDeductions = async (month?: number, year?: number) => {
  let result = payrollDeductions;
  if (month) result = result.filter(d => d.month === month);
  if (year) result = result.filter(d => d.year === year);
  return result.map(d => {
    const emp = employees.find(e => e.id === d.employeeId || e.employeeId === d.employeeId);
    return { ...d, employeeName: emp?.name || 'Unknown' };
  });
};

export const upsertPayrollDeduction = async (data: Omit<PayrollDeduction, 'id' | 'totalDeductions'>) => {
  const totalDeductions = data.leaveDeduction + data.taxAmount + data.otherDeductions;
  const existing = payrollDeductions.find(d => d.employeeId === data.employeeId && d.month === data.month && d.year === data.year);
  if (existing) {
    Object.assign(existing, { ...data, totalDeductions });
    return existing;
  }
  const deduction: PayrollDeduction = { ...data, id: 'pd_' + crypto.randomBytes(4).toString('hex'), totalDeductions };
  payrollDeductions.push(deduction);
  return deduction;
};
