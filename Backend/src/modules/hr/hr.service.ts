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
  // Compute salary checks for all structures and insert them into the payslips array
  const computedList: Payslip[] = [];
  
  for (const struct of salaryStructures) {
    const emp = employees.find(e => e.id === struct.employeeId || e.employeeId === struct.employeeId);
    if (!emp) continue;

    // Check if payslip already exists
    const exists = payslips.some(p => p.employeeId === struct.employeeId && p.month === month && p.year === year);
    if (!exists) {
      const netSalary = struct.basicSalary + struct.allowances - struct.deductions;
      const newPay: Payslip = {
        id: 'pay_' + crypto.randomBytes(4).toString('hex'),
        employeeId: struct.employeeId,
        name: emp.name,
        month,
        year,
        basicSalary: struct.basicSalary,
        allowances: struct.allowances,
        deductions: struct.deductions,
        netSalary,
        status: 'PAID'
      };
      payslips.push(newPay);
      computedList.push(newPay);
    }
  }

  return computedList;
};
