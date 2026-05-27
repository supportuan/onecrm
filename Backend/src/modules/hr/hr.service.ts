import crypto from 'crypto';
import { prisma } from '../../prisma.js';

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
  employmentStatus?: 'Active' | 'On Leave' | 'Resigned' | 'Terminated';
  dob?: string;
  address?: string;
  emergencyContact?: string;
  hireDate?: string;
  documents?: { id: string; name: string; type: string; size?: string; uploadedAt: string }[];
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

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING_MANAGER' | 'PENDING_HR' | 'APPROVED' | 'REJECTED';
  managerApproval: 'PENDING' | 'APPROVED' | 'REJECTED';
  hrApproval: 'PENDING' | 'APPROVED' | 'REJECTED';
  managerRemarks?: string;
  hrRemarks?: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  currentStage: string;
  appliedDate: string;
  fields: Record<string, any>;
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
  conversionsCount?: number;
  incentive?: number;
  lopDays?: number;
  lopDeductions?: number;
  taxDeductions?: number;
}

// ----------------------------------------------------
// STATE PRE-SEEDING
// ----------------------------------------------------
let employees: Employee[] = [
  { id: '1', name: 'Raju Kalla', employeeId: 'E001', email: 'raju.kalla@onecrm.com', access_role: 'EMPLOYEE', department: 'Engineering', designation: 'Senior Developer', biometricId: 'E001', location: 'Chicago Office', employmentStatus: 'Active', dob: '1990-05-15', address: '456 West Loop, Chicago IL', emergencyContact: 'Sita Kalla (+1 312-555-0144)', hireDate: '2023-03-01', documents: [] },
  { id: '2', name: 'Jane Admin', employeeId: 'E002', email: 'jane.admin@onecrm.com', access_role: 'SUPER_ADMIN', department: 'Operations', designation: 'Operations Lead', biometricId: 'E002', location: 'Chicago Office', employmentStatus: 'Active', dob: '1985-11-20', address: '789 North Michigan Ave, Chicago IL', emergencyContact: 'Mark Admin (+1 312-555-0188)', hireDate: '2021-06-15', documents: [] },
  { id: '3', name: 'Alice Smith', employeeId: 'E003', email: 'alice.smith@onecrm.com', access_role: 'HR_MANAGER', department: 'Human Resources', designation: 'HR Manager', biometricId: 'E003', location: 'New York Office', employmentStatus: 'Active', dob: '1988-09-10', address: '123 Broadway, New York NY', emergencyContact: 'John Smith (+1 212-555-0122)', hireDate: '2022-01-10', documents: [] },
  { id: '4', name: 'Bob Johnson', employeeId: 'E004', email: 'bob.johnson@onecrm.com', access_role: 'PAYROLL_ADMIN', department: 'Finance', designation: 'Payroll Admin', biometricId: 'E004', location: 'New York Office', employmentStatus: 'Active', dob: '1992-04-25', address: '456 Park Avenue, New York NY', emergencyContact: 'Mary Johnson (+1 212-555-0155)', hireDate: '2024-02-01', documents: [] },
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

let leaveRequests: LeaveRequest[] = [
  { id: 'req_1', employeeId: '1', employeeName: 'Raju Kalla', leaveTypeId: 'type_1', leaveTypeName: 'Casual Leave', startDate: '2026-06-01', endDate: '2026-06-03', reason: 'Family function trip', status: 'PENDING_MANAGER', managerApproval: 'PENDING', hrApproval: 'PENDING', createdAt: new Date().toISOString() },
  { id: 'req_2', employeeId: '3', employeeName: 'Alice Smith', leaveTypeId: 'type_2', leaveTypeName: 'Medical Leave', startDate: '2026-05-12', endDate: '2026-05-13', reason: 'Doctor checkup', status: 'APPROVED', managerApproval: 'APPROVED', hrApproval: 'APPROVED', createdAt: new Date().toISOString() }
];

let candidates: Candidate[] = [
  {
    id: 'c1',
    name: 'Raju Kalla',
    email: 'raju.kalla@gmail.com',
    phone: '+91 98765 43210',
    role: 'Senior developer',
    department: 'Engineering',
    currentStage: 'tech_round',
    appliedDate: '2026-05-18',
    fields: {
      jobId: 'job_101',
      jobTitle: 'Senior developer',
      experienceRequired: '5+ years',
      salaryRange: '₹18,00,000 - ₹24,00,000',
      jobLocation: 'Chicago office',
      workMode: 'hybrid',
      postingChannel: 'LinkedIn',
      careerPortalUrl: 'https://careers.onecrm.com/jobs/101',
      recruiterAssigned: 'Alice Smith',
      expectedSalary: '₹22,00,000',
      noticePeriod: '30 days',
      applicationSource: 'LinkedIn referral',
      screeningStatus: 'shortlisted',
      skillMatchPct: '92%',
      resumeScore: '8.8/10',
      interviewerName: 'Alice Smith',
      communicationSkillsRating: '4.5/5',
      hrFeedback: 'Strong cultural fit and communications.',
      technicalInterviewer: 'Jane Admin',
      codingScore: '88/100',
      technicalSkillsRating: '4.6/5',
      testScore: '90%'
    }
  },
  {
    id: 'c2',
    name: 'Jane Admin',
    email: 'jane.admin@onecrm.com',
    phone: '+91 99988 87766',
    role: 'Operations manager',
    department: 'Operations',
    currentStage: 'hrms_created',
    appliedDate: '2026-05-02',
    fields: {
      jobId: 'job_102',
      jobTitle: 'Operations manager',
      experienceRequired: '8+ years',
      salaryRange: '₹20,00,000 - ₹26,00,000',
      jobLocation: 'New York office',
      workMode: 'onsite',
      postingChannel: 'Direct career site',
      careerPortalUrl: 'https://careers.onecrm.com/jobs/102',
      recruiterAssigned: 'Alice Smith',
      expectedSalary: '₹24,00,000',
      noticePeriod: 'immediate',
      applicationSource: 'organic search',
      screeningStatus: 'shortlisted',
      skillMatchPct: '98%',
      resumeScore: '9.5/10',
      interviewerName: 'Alice Smith',
      communicationSkillsRating: '5.0/5',
      hrFeedback: 'exceptional leader profiles.',
      technicalInterviewer: 'Bob Johnson',
      codingScore: 'not applicable',
      technicalSkillsRating: '4.9/5',
      testScore: '95%',
      managerName: 'Jane Admin',
      leadershipRating: '5.0/5',
      teamFitRating: '4.8/5',
      behavioralFeedback: 'highly recommended.',
      finalSalaryOffered: '₹25,00,000',
      offerId: 'off_902',
      offeredSalary: '₹25,00,000',
      offerStatus: 'accepted',
      verificationStatus: 'verified',
      employeeId: 'E002',
      officialEmail: 'jane.admin@onecrm.com',
      reportingManager: 'Alice Smith',
      employeeStatus: 'active'
    }
  }
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

export const createEmployee = async (data: Partial<Employee>) => {
  if (!data.name?.trim() || !data.email?.trim() || !data.employeeId?.trim()) {
    throw new Error('name, email, and employeeId are required');
  }
  const exists = employees.some(
    e => e.email.toLowerCase() === data.email!.toLowerCase() || e.employeeId === data.employeeId
  );
  if (exists) throw new Error('Employee with this email or ID already exists');

  const emp: Employee = {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    employeeId: data.employeeId.trim(),
    email: data.email.trim().toLowerCase(),
    access_role: data.access_role || 'EMPLOYEE',
    department: data.department || 'Operations',
    designation: data.designation || 'Staff Member',
    phone: data.phone || null,
    biometricId: data.biometricId || data.employeeId.trim(),
    location: data.location || 'HQ Office',
    employmentStatus: data.employmentStatus || 'Active',
    documents: [],
  };
  employees.push(emp);
  return emp;
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
export const updateEmployee = async (employeeId: string, updates: Partial<Employee>) => {
  const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId);
  if (!emp) throw new Error('Employee not found');
  if (updates.name !== undefined) emp.name = updates.name;
  if (updates.department !== undefined) emp.department = updates.department;
  if (updates.designation !== undefined) emp.designation = updates.designation;
  if (updates.phone !== undefined) emp.phone = updates.phone;
  if (updates.location !== undefined) emp.location = updates.location;
  if (updates.employmentStatus !== undefined) emp.employmentStatus = updates.employmentStatus;
  if (updates.dob !== undefined) emp.dob = updates.dob;
  if (updates.address !== undefined) emp.address = updates.address;
  if (updates.emergencyContact !== undefined) emp.emergencyContact = updates.emergencyContact;
  if (updates.hireDate !== undefined) emp.hireDate = updates.hireDate;
  if (updates.access_role !== undefined) emp.access_role = updates.access_role;
  return emp;
};

export const getEmployeeDocuments = async (employeeId: string) => {
  const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId);
  if (!emp) throw new Error('Employee not found');
  return emp.documents || [];
};

export const uploadEmployeeDocument = async (employeeId: string, doc: { name: string; type: string; size?: string }) => {
  const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId);
  if (!emp) throw new Error('Employee not found');
  if (!doc?.name?.trim() || !doc?.type?.trim()) {
    throw new Error('Document name and type are required');
  }
  if (!emp.documents) emp.documents = [];
  const newDoc = {
    id: 'doc_' + crypto.randomBytes(4).toString('hex'),
    name: doc.name,
    type: doc.type,
    size: doc.size || '1.5 MB',
    uploadedAt: new Date().toISOString()
  };
  emp.documents.push(newDoc);
  return newDoc;
};

export const deleteEmployeeDocument = async (employeeId: string, docId: string) => {
  const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId);
  if (!emp) throw new Error('Employee not found');
  emp.documents = (emp.documents || []).filter(d => d.id !== docId);
  return { success: true };
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
  if (!employeeId?.trim()) {
    throw new Error('Employee ID is required for remote clock-in');
  }
  const dateStr = new Date().toISOString().split('T')[0];
  const nowStr = new Date().toISOString();

  const emp = employees.find(e => e.email === employeeId || e.employeeId === employeeId || e.id === employeeId);
  if (!emp) throw new Error('Employee not found for clock-in');
  
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
  if (!employeeId?.trim()) throw new Error('Employee ID is required');
  const emp = employees.find(e => e.email === employeeId || e.id === employeeId || e.employeeId === employeeId);
  if (!emp) throw new Error('Employee not found');
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

export const getLeaveRequests = async () => {
  return leaveRequests;
};

export const applyLeaveRequest = async (employeeId: string, data: any) => {
  if (!employeeId?.trim()) throw new Error('Employee ID is required');
  const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId || e.email === employeeId);
  if (!emp) throw new Error('Employee not found');

  const lt = leaveTypes.find(t => t.id === data.leaveTypeId);
  if (!lt) throw new Error('Invalid leave type ID');
  const newReq: LeaveRequest = {
    id: 'req_' + crypto.randomBytes(4).toString('hex'),
    employeeId: emp.id,
    employeeName: emp.name,
    leaveTypeId: lt?.id || 'type_1',
    leaveTypeName: lt?.name || 'Casual Leave',
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
    status: 'PENDING_MANAGER',
    managerApproval: 'PENDING',
    hrApproval: 'PENDING',
    createdAt: new Date().toISOString()
  };
  leaveRequests.push(newReq);
  return newReq;
};

export const processLeaveApproval = async (id: string, role: 'MANAGER' | 'HR', status: 'APPROVED' | 'REJECTED', remarks?: string) => {
  const req = leaveRequests.find(r => r.id === id);
  if (!req) throw new Error('Leave request not found');

  if (role === 'MANAGER') {
    req.managerApproval = status;
    req.managerRemarks = remarks || 'Approved by Manager';
    if (status === 'APPROVED') {
      req.status = 'PENDING_HR';
    } else {
      req.status = 'REJECTED';
    }
  } else if (role === 'HR') {
    req.hrApproval = status;
    req.hrRemarks = remarks || 'Approved by HR';
    if (status === 'APPROVED') {
      req.status = 'APPROVED';
      // Automatically toggle employee to 'On Leave' if current date is inside start/end range
      const today = new Date().toISOString().split('T')[0];
      if (today >= req.startDate && today <= req.endDate) {
        const emp = employees.find(e => e.id === req.employeeId);
        if (emp) emp.employmentStatus = 'On Leave';
      }
    } else {
      req.status = 'REJECTED';
    }
  }
  return req;
};

export const getLeaveBalancesReport = async () => {
  return employees.map(emp => {
    const assignments = planAssignments.filter(a => a.employee_id === emp.id);
    const balances = leaveTypes.map(lt => {
      const def = leaveDefinitions.find(d => assignments.some(a => a.plan_id === d.plan_id) && d.leave_type_id === lt.id);
      const allocated = def ? def.annual_quota : 12;
      
      // Calculate approved leave request days
      const approvedReqs = leaveRequests.filter(r => r.employeeId === emp.id && r.leaveTypeId === lt.id && r.status === 'APPROVED');
      let used = 0;
      approvedReqs.forEach(r => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        used += diffDays;
      });

      return {
        leaveTypeId: lt.id,
        leaveTypeName: lt.name,
        leaveTypeCode: lt.code,
        allocated,
        used,
        remaining: Math.max(0, allocated - used)
      };
    });

    return {
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department,
      balances
    };
  });
};

export const getCandidates = async () => {
  return candidates;
};

export const createCandidate = async (candidate: Omit<Candidate, 'id' | 'appliedDate'>) => {
  const newCand: Candidate = {
    id: 'c_' + crypto.randomBytes(4).toString('hex'),
    ...candidate,
    appliedDate: new Date().toISOString().split('T')[0]
  };
  candidates.push(newCand);
  return newCand;
};

export const updateCandidate = async (id: string, updates: Partial<Candidate>) => {
  const cand = candidates.find(c => c.id === id);
  if (!cand) throw new Error('Candidate not found');
  if (updates.currentStage) cand.currentStage = updates.currentStage;
  if (updates.fields) cand.fields = { ...cand.fields, ...updates.fields };
  return cand;
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
  // Compute salary checks for all structures and insert them into the payslips array
  const computedList: Payslip[] = [];
  
  for (const struct of salaryStructures) {
    const emp = employees.find(e => e.id === struct.employeeId || e.employeeId === struct.employeeId);
    if (!emp) continue;

    // Check if payslip already exists
    const exists = payslips.some(p => p.employeeId === struct.employeeId && p.month === month && p.year === year);
    if (!exists) {
      // 1. Calculate dynamic performance incentives based on Converted Leads
      let conversionsCount = 0;
      try {
        // Query the prisma database to count converted leads assigned to this employee
        conversionsCount = await prisma.lead.count({
          where: {
            assignedCounsellorId: parseInt(emp.id),
            status: 'CONVERTED'
          }
        });
      } catch (err) {
        // Fallback mock logic if prisma table is empty or error occurs
        conversionsCount = emp.id === '1' ? 4 : emp.id === '3' ? 6 : 0;
      }
      
      const incentivePerConversion = 150; // $150 incentive per conversion
      const incentive = conversionsCount * incentivePerConversion;

      // 2. Calculate Auto deductions for leave (LOP)
      let lopDays = 0;
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      
      const leavesInMonth = leaveRequests.filter(r => 
        r.employeeId === emp.id && 
        r.status === 'APPROVED' &&
        new Date(r.startDate) >= startOfMonth &&
        new Date(r.endDate) <= endOfMonth
      );

      leavesInMonth.forEach(r => {
        if (r.leaveTypeName.toLowerCase().includes('unpaid') || r.leaveTypeName.toLowerCase().includes('excess')) {
          const start = new Date(r.startDate);
          const end = new Date(r.endDate);
          const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          lopDays += diffDays;
        }
      });

      // Also count attendance ABSENT days
      const attendanceForMonth = attendanceRecords.filter(r => 
        r.employee_id === emp.id && 
        r.status === 'ABSENT' && 
        new Date(r.date) >= startOfMonth && 
        new Date(r.date) <= endOfMonth
      );
      lopDays += attendanceForMonth.length;

      const dailyRate = struct.basicSalary / 30;
      const lopDeduction = parseFloat((lopDays * dailyRate).toFixed(2));

      // 3. Progressive Tax Auto Deduction
      const taxableAmount = struct.basicSalary + struct.allowances + incentive;
      let taxDeduction = 0;
      if (taxableAmount > 7000) {
        taxDeduction += (taxableAmount - 7000) * 0.20 + 2000 * 0.15 + 2000 * 0.10;
      } else if (taxableAmount > 5000) {
        taxDeduction += (taxableAmount - 5000) * 0.15 + 2000 * 0.10;
      } else if (taxableAmount > 3000) {
        taxDeduction += (taxableAmount - 3000) * 0.10;
      }
      taxDeduction = parseFloat(taxDeduction.toFixed(2));

      const netSalary = parseFloat((struct.basicSalary + struct.allowances + incentive - struct.deductions - lopDeduction - taxDeduction).toFixed(2));

      const newPay: Payslip = {
        id: 'pay_' + crypto.randomBytes(4).toString('hex'),
        employeeId: struct.employeeId,
        name: emp.name,
        month,
        year,
        basicSalary: struct.basicSalary,
        allowances: struct.allowances + incentive,
        deductions: struct.deductions + lopDeduction + taxDeduction,
        netSalary,
        status: 'PAID',
        conversionsCount,
        incentive,
        lopDays,
        lopDeductions: lopDeduction,
        taxDeductions: taxDeduction
      };

      payslips.push(newPay);
      computedList.push(newPay);
    }
  }

  return computedList;
};

// ----------------------------------------------------
// 13. HR Groups
// ----------------------------------------------------
export interface HrGroup {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  createdAt: string;
}

let hrGroups: HrGroup[] = [
  { id: 'grp_1', name: 'Admissions Counselors', description: 'Front-line student counselling team', memberIds: ['1', '3'], createdAt: '2026-01-15T00:00:00.000Z' },
  { id: 'grp_2', name: 'Payroll Operations', description: 'Finance and payroll processing unit', memberIds: ['4'], createdAt: '2026-02-01T00:00:00.000Z' },
];

export const getGroups = async () => hrGroups;

export const createGroup = async (data: { name: string; description?: string; memberIds?: string[] }) => {
  const group: HrGroup = {
    id: 'grp_' + crypto.randomBytes(4).toString('hex'),
    name: data.name.trim(),
    description: data.description?.trim() || '',
    memberIds: data.memberIds || [],
    createdAt: new Date().toISOString(),
  };
  hrGroups.push(group);
  return group;
};

// ----------------------------------------------------
// 14. Business Goals
// ----------------------------------------------------
export interface BusinessGoal {
  id: string;
  name: string;
  description: string;
  targetMetric: string;
  linkedModules: string[];
  createdAt: string;
}

let businessGoals: BusinessGoal[] = [
  { id: 'goal_enrol_2026', name: 'Increase Enrolments Q2 2026', description: 'Grow student enrolments by 15%', targetMetric: 'enrolments', linkedModules: [], createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'goal_revenue_2026', name: 'Revenue Target FY26', description: 'Achieve institutional revenue milestones', targetMetric: 'revenue', linkedModules: [], createdAt: '2026-01-01T00:00:00.000Z' },
];

export const getBusinessGoals = async () => businessGoals;

export const createBusinessGoal = async (data: { name: string; description?: string; targetMetric?: string }) => {
  const goal: BusinessGoal = {
    id: 'goal_' + crypto.randomBytes(4).toString('hex'),
    name: data.name.trim(),
    description: data.description?.trim() || '',
    targetMetric: data.targetMetric?.trim() || 'general',
    linkedModules: [],
    createdAt: new Date().toISOString(),
  };
  businessGoals.push(goal);
  return goal;
};

export const linkBusinessGoalToHr = async (goalId: string) => {
  if (!goalId || !/^[a-zA-Z0-9_-]+$/.test(goalId)) {
    throw new Error('Invalid business goal ID');
  }
  const goal = businessGoals.find(g => g.id === goalId);
  if (!goal) throw new Error('Business goal not found');
  if (!goal.linkedModules.includes('HR')) goal.linkedModules.push('HR');
  return goal;
};

// ----------------------------------------------------
// 15. Attendance Process Templates
// ----------------------------------------------------
export interface AttendanceProcessTemplate {
  id: string;
  name: string;
  description: string;
  steps: string[];
  createdAt: string;
}

let attendanceTemplates: AttendanceProcessTemplate[] = [
  {
    id: 'tpl_att_1',
    name: 'Standard Daily Attendance',
    description: 'Biometric check-in, remote fallback, regularization workflow',
    steps: ['Biometric scan', 'IP validation', 'Manager regularization review', 'HR audit'],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const getAttendanceTemplates = async () => attendanceTemplates;

export const getAttendanceTemplate = async (id: string) => {
  const tpl = attendanceTemplates.find(t => t.id === id);
  if (!tpl) throw new Error('Attendance process template not found');
  return tpl;
};

// ----------------------------------------------------
// 16. Attendance Summary Report
// ----------------------------------------------------
export const getAttendanceSummaryReport = async (month?: number, year?: number) => {
  const m = month ?? new Date().getMonth() + 1;
  const y = year ?? new Date().getFullYear();
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);

  return employees.map(emp => {
    const records = attendanceRecords.filter(r => {
      if (r.employee_id !== emp.id) return false;
      const d = new Date(r.date);
      return d >= start && d <= end;
    });
    const present = records.filter(r => r.status === 'PRESENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const halfDay = records.filter(r => r.status === 'HALF_DAY').length;
    return {
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department,
      month: m,
      year: y,
      present,
      late,
      absent,
      halfDay,
      totalDays: records.length,
    };
  });
};

// ----------------------------------------------------
// 17. Counselor Performance Metrics
// ----------------------------------------------------
export const getCounselorMetrics = async (counselorId: string | null | undefined) => {
  if (!counselorId || counselorId === 'null' || counselorId === 'undefined') {
    throw new Error('Counselor ID is required');
  }
  const emp = employees.find(e => e.id === counselorId || e.employeeId === counselorId || e.email === counselorId);
  if (!emp) throw new Error('Counselor not found');

  let leadsHandled = 0;
  let conversions = 0;
  let applications = 0;
  try {
    leadsHandled = await prisma.lead.count({
      where: { assignedCounsellorId: parseInt(emp.id) || undefined },
    });
    conversions = await prisma.lead.count({
      where: { assignedCounsellorId: parseInt(emp.id) || undefined, status: 'CONVERTED' },
    });
    applications = await prisma.lead.count({
      where: { assignedCounsellorId: parseInt(emp.id) || undefined, status: { in: ['CONVERTED', 'QUALIFIED', 'CONTACTED'] } },
    });
  } catch {
    leadsHandled = emp.id === '1' ? 24 : emp.id === '3' ? 18 : 5;
    conversions = emp.id === '1' ? 4 : emp.id === '3' ? 6 : 1;
    applications = emp.id === '1' ? 8 : emp.id === '3' ? 10 : 2;
  }

  const revenueGenerated = conversions * 2500;
  return {
    counselorId: emp.employeeId,
    name: emp.name,
    department: emp.department,
    leadsHandled,
    applications,
    conversions,
    enrolments: conversions,
    revenueGenerated,
    conversionRate: leadsHandled > 0 ? parseFloat(((conversions / leadsHandled) * 100).toFixed(1)) : 0,
  };
};

// ----------------------------------------------------
// 18. KPI Definitions & Performance Reviews
// ----------------------------------------------------
export interface KpiDefinition {
  id: string;
  name: string;
  description: string;
  metric: string;
  roleCategory: 'counsellor' | 'marketing' | 'processing' | 'general';
  createdAt: string;
}

export interface PerformanceReviewRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  cycle: string;
  manager: string;
  rating: number;
  status: string;
  date: string;
  kpiScores?: { kpi1: number; kpi2: number; kpi3: number; feedback?: string };
}

let kpiDefinitions: KpiDefinition[] = [
  { id: 'kpi_1', name: 'Lead Conversion Rate', description: 'Rate of converting leads to enrolments', metric: 'percentage', roleCategory: 'counsellor', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'kpi_2', name: 'Leads Generated', description: 'Marketing leads generated per period', metric: 'count', roleCategory: 'marketing', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'kpi_3', name: 'Application Processing Time', description: 'Average days to process applications', metric: 'days', roleCategory: 'processing', createdAt: '2026-01-01T00:00:00.000Z' },
];

let performanceReviews: PerformanceReviewRecord[] = [
  { id: 'rev_1', name: 'Raju Kalla', employeeId: 'E001', department: 'Engineering', cycle: 'FY26 H1 Review', manager: 'Jane Admin', rating: 4.5, status: 'Completed', date: '2026-05-10' },
  { id: 'rev_2', name: 'Alice Smith', employeeId: 'E003', department: 'Human Resources', cycle: 'FY26 H1 Review', manager: 'Jane Admin', rating: 4.8, status: 'Completed', date: '2026-05-14' },
  { id: 'rev_3', name: 'Bob Johnson', employeeId: 'E004', department: 'Finance', cycle: 'FY26 H1 Review', manager: 'Alice Smith', rating: 0, status: 'Manager Review', date: '2026-05-22' },
];

export const getKpiDefinitions = async () => kpiDefinitions;

export const createKpiDefinition = async (data: { name: string; description?: string; metric: string; roleCategory?: KpiDefinition['roleCategory'] }) => {
  const kpi: KpiDefinition = {
    id: 'kpi_' + crypto.randomBytes(4).toString('hex'),
    name: data.name.trim(),
    description: data.description?.trim() || '',
    metric: data.metric.trim(),
    roleCategory: data.roleCategory || 'general',
    createdAt: new Date().toISOString(),
  };
  kpiDefinitions.push(kpi);
  return kpi;
};

export const getPerformanceReviews = async () => performanceReviews;

export const createPerformanceReview = async (data: Partial<PerformanceReviewRecord>) => {
  if (!data.name?.trim() || !data.employeeId?.trim()) {
    throw new Error('Employee name and ID are required');
  }
  const review: PerformanceReviewRecord = {
    id: 'rev_' + crypto.randomBytes(4).toString('hex'),
    name: data.name.trim(),
    employeeId: data.employeeId.trim(),
    department: data.department || 'Operations',
    cycle: data.cycle || 'FY26 H1 Review',
    manager: data.manager || 'HR Manager',
    rating: 0,
    status: data.status || 'Self-Review',
    date: new Date().toISOString().split('T')[0],
  };
  performanceReviews.unshift(review);
  return review;
};

export const updatePerformanceReview = async (id: string, updates: Partial<PerformanceReviewRecord>) => {
  const review = performanceReviews.find(r => r.id === id);
  if (!review) throw new Error('Performance review not found');
  if (updates.rating !== undefined) review.rating = updates.rating;
  if (updates.status !== undefined) review.status = updates.status;
  if (updates.kpiScores !== undefined) review.kpiScores = updates.kpiScores;
  if (updates.status === 'Completed') review.date = new Date().toISOString().split('T')[0];
  return review;
};

export const getMarketingTeamKpis = async (teamId: string | null | undefined) => {
  if (!teamId || teamId === 'null') throw new Error('Team ID is required');
  return {
    teamId,
    leadsGenerated: 142,
    costPerLead: 18.5,
    campaignRoi: 3.2,
    kpis: kpiDefinitions.filter(k => k.roleCategory === 'marketing'),
  };
};
