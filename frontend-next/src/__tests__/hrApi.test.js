/**
 * Tests for services/hrApi.js
 * Covers: Employees, Attendance, Leave, Biometric, Regularization, Devices, Networks
 */

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: jest.fn(),
  authFetch: jest.fn(),
}));

const authFetch = require('@/lib/api').default;

beforeAll(() => {
  global.localStorage = {
    _store: {},
    getItem(k) { return this._store[k] ?? null; },
    setItem(k, v) { this._store[k] = String(v); },
    clear() { this._store = {}; },
  };
  global.window = global;
  global.FormData = class {
    constructor() { this._data = {}; }
    append(k, v) { this._data[k] = v; }
  };
});

import {
  getEmployees,
  getEmployeeById,
  updateEmployee,
  createEmployee,
  deleteEmployeeDocument,
  getTeam,
  assignAccessRole,
  bulkImportEmployees,
  getAttendanceSettings,
  updateAttendanceSettings,
  getDevices,
  createDevice,
  deleteDevice,
  getNetworks,
  createNetwork,
  deleteNetwork,
  getAttendanceEvents,
  getMyAttendance,
  getRegularizations,
  requestRegularization,
  processRegularization,
  getHrDashboardSummary,
  getHrMe,
  getMyLeaveRequests,
  getPendingLeaveRequests,
  createLeaveRequest,
  processLeaveRequest,
  cancelLeaveRequest,
  getLeavePlans,
  submitRemoteClockIn,
  processBiometricLogs,
} from '@/services/hrApi';

const BASE = '/api/hr';

const ok = (data) =>
  authFetch.mockResolvedValue({ ok: true, json: async () => data });

const err = (msg = 'Error') =>
  authFetch.mockResolvedValue({ ok: false, json: async () => ({ message: msg }) });

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('tenantId', 'test-tenant');
});

// ─── handleResponse ───────────────────────────────────────────
describe('handleResponse error handling', () => {
  it('throws error with server message on non-ok response', async () => {
    err('Employee not found');
    await expect(getEmployeeById(99)).rejects.toThrow('Employee not found');
  });

  it('throws fallback HTTP error when body has no message', async () => {
    authFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    await expect(getEmployeeById(99)).rejects.toThrow(/HTTP error/);
  });
});

// ─── Employees ───────────────────────────────────────────────
describe('getEmployees', () => {
  it('calls GET /employees with no status', async () => {
    ok([]);
    await getEmployees();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/employees`);
  });

  it('appends status param when provided', async () => {
    ok([]);
    await getEmployees('ACTIVE');
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('status=ACTIVE');
  });

  it('returns the employee list', async () => {
    const emp = [{ id: 1, fullName: 'Alice' }];
    ok(emp);
    const result = await getEmployees();
    expect(result).toEqual(emp);
  });
});

describe('getEmployeeById', () => {
  it('calls GET /employees/:id', async () => {
    ok({ id: 5 });
    await getEmployeeById(5);
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/employees/5`);
  });
});

describe('updateEmployee', () => {
  it('calls PUT /employees/:id with JSON body', async () => {
    ok({ id: 2 });
    await updateEmployee(2, { fullName: 'Bob Updated' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/employees/2`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ fullName: 'Bob Updated' });
  });
});

describe('createEmployee', () => {
  it('calls POST /employees with JSON body', async () => {
    ok({ id: 10 });
    const data = { fullName: 'Eve', email: 'eve@company.com', department: 'HR' };
    await createEmployee(data);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/employees`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(data);
  });
});

describe('deleteEmployeeDocument', () => {
  it('calls DELETE /employees/:id/documents/:docId', async () => {
    ok({});
    await deleteEmployeeDocument(3, 7);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/employees/3/documents/7`);
    expect(init.method).toBe('DELETE');
  });
});

describe('getTeam', () => {
  it('calls GET /team', async () => {
    ok([]);
    await getTeam();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/team`);
  });
});

describe('assignAccessRole', () => {
  it('calls PUT /employees/:id/role with role body', async () => {
    ok({});
    await assignAccessRole(4, 'HR');
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/employees/4/role`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ role: 'HR' });
  });
});

describe('bulkImportEmployees', () => {
  it('calls POST /employees/bulk with rows array', async () => {
    ok({ created: 5 });
    const rows = [{ fullName: 'A' }, { fullName: 'B' }];
    await bulkImportEmployees(rows);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/employees/bulk`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(rows);
  });
});

// ─── Attendance Settings ──────────────────────────────────────
describe('getAttendanceSettings', () => {
  it('calls GET /attendance/settings', async () => {
    ok({ grace: 10 });
    await getAttendanceSettings();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/settings`);
  });
});

describe('updateAttendanceSettings', () => {
  it('calls PUT /attendance/settings with settings body', async () => {
    ok({});
    await updateAttendanceSettings({ grace: 15, shiftStart: '09:00' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/settings`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toMatchObject({ grace: 15 });
  });
});

// ─── Devices (Biometric) ──────────────────────────────────────
describe('getDevices', () => {
  it('calls GET /attendance/devices', async () => {
    ok([]);
    await getDevices();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/devices`);
  });
});

describe('createDevice', () => {
  it('calls POST /attendance/devices with device body', async () => {
    ok({ id: 1 });
    await createDevice({ ip: '192.168.1.100', name: 'Door Scanner' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/devices`);
    expect(init.method).toBe('POST');
  });
});

describe('deleteDevice', () => {
  it('calls DELETE /attendance/devices/:id', async () => {
    ok({});
    await deleteDevice(3);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/devices/3`);
    expect(init.method).toBe('DELETE');
  });
});

// ─── Networks (IP Whitelist) ──────────────────────────────────
describe('getNetworks', () => {
  it('calls GET /attendance/networks', async () => {
    ok([]);
    await getNetworks();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/networks`);
  });
});

describe('createNetwork', () => {
  it('calls POST /attendance/networks with network body', async () => {
    ok({ id: 1 });
    await createNetwork({ cidr: '10.0.0.0/24' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/networks`);
    expect(init.method).toBe('POST');
  });
});

describe('deleteNetwork', () => {
  it('calls DELETE /attendance/networks/:id', async () => {
    ok({});
    await deleteNetwork(2);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/networks/2`);
    expect(init.method).toBe('DELETE');
  });
});

// ─── Attendance Events & My Attendance ───────────────────────
describe('getAttendanceEvents', () => {
  it('calls GET /attendance/events with date param', async () => {
    ok([]);
    await getAttendanceEvents('2025-07-01');
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('date=2025-07-01');
  });

  it('calls without param when date is absent', async () => {
    ok([]);
    await getAttendanceEvents();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/events`);
  });
});

describe('getMyAttendance', () => {
  it('calls GET /attendance/me with month and year', async () => {
    ok([]);
    await getMyAttendance(7, 2025);
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('month=7');
    expect(url).toContain('year=2025');
  });

  it('calls without params when month/year not provided', async () => {
    ok([]);
    await getMyAttendance();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/me`);
  });
});

// ─── Regularization ───────────────────────────────────────────
describe('getRegularizations', () => {
  it('calls GET /attendance/regularizations', async () => {
    ok([]);
    await getRegularizations();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/regularizations`);
  });
});

describe('requestRegularization', () => {
  it('calls POST /attendance/regularizations with data', async () => {
    ok({ id: 1 });
    await requestRegularization({ date: '2025-07-01', reason: 'WFH' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/regularizations`);
    expect(init.method).toBe('POST');
  });
});

describe('processRegularization', () => {
  it('calls PUT /attendance/regularizations/:id with status', async () => {
    ok({ id: 1, status: 'APPROVED' });
    await processRegularization(1, 'APPROVED', 'Looks good');
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/regularizations/1`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ status: 'APPROVED', approverRemarks: 'Looks good' });
  });
});

// ─── Leave ───────────────────────────────────────────────────
describe('getHrDashboardSummary', () => {
  it('calls GET /dashboard/summary', async () => {
    ok({});
    await getHrDashboardSummary();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/dashboard/summary`);
  });
});

describe('getHrMe', () => {
  it('calls GET /me', async () => {
    ok({ id: 1 });
    await getHrMe();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/me`);
  });
});

describe('getMyLeaveRequests', () => {
  it('calls GET /leave/requests?mine=true', async () => {
    ok([]);
    await getMyLeaveRequests();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/leave/requests?mine=true`);
  });
});

describe('getPendingLeaveRequests', () => {
  it('calls GET /leave/requests?status=PENDING', async () => {
    ok([]);
    await getPendingLeaveRequests();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/leave/requests?status=PENDING`);
  });
});

describe('createLeaveRequest', () => {
  it('calls POST /leave/requests with data', async () => {
    ok({ id: 1 });
    const data = { leaveType: 'SICK', startDate: '2025-07-10', endDate: '2025-07-11' };
    await createLeaveRequest(data);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/leave/requests`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(data);
  });
});

describe('processLeaveRequest', () => {
  it('calls PUT /leave/requests/:id/process with data', async () => {
    ok({ id: 3, status: 'APPROVED' });
    await processLeaveRequest(3, { status: 'APPROVED', remarks: 'OK' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/leave/requests/3/process`);
    expect(init.method).toBe('PUT');
  });
});

describe('cancelLeaveRequest', () => {
  it('calls PUT /leave/requests/:id/cancel', async () => {
    ok({ id: 3, status: 'CANCELLED' });
    await cancelLeaveRequest(3);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/leave/requests/3/cancel`);
    expect(init.method).toBe('PUT');
  });
});

describe('getLeavePlans', () => {
  it('calls GET /leave/plans', async () => {
    ok([]);
    await getLeavePlans();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/leave/plans`);
  });
});

// ─── Remote Clock-in & Biometric Logs ────────────────────────
describe('submitRemoteClockIn', () => {
  it('calls POST /attendance/remote-clockin with data', async () => {
    ok({ status: 'IN' });
    await submitRemoteClockIn({ latitude: 12.9, longitude: 77.5 });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/remote-clockin`);
    expect(init.method).toBe('POST');
  });
});

describe('processBiometricLogs', () => {
  it('calls POST /attendance/process-biometric-logs', async () => {
    ok({ processed: 12 });
    await processBiometricLogs();
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/attendance/process-biometric-logs`);
    expect(init.method).toBe('POST');
  });
});
