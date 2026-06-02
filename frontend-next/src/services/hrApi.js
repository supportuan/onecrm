import authFetch from "@/lib/api";

const API_URL = "/api/hr";

// Helper to handle responses
const handleResponse = async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }
  return res.json();
};

// Tenant Fetch Helper
const tenantFetch = async (url, options = {}) => {
  const tenantId =
    typeof window !== "undefined"
      ? localStorage.getItem("tenantId") || "default-tenant"
      : "default-tenant";
  const headers = {
    ...options.headers,
    "x-tenant-id": tenantId,
  };
  return authFetch(url, { ...options, headers });
};

// ==========================================
// 1. Employees & Directory Service
// ==========================================

export const getEmployees = async () => {
  const res = await tenantFetch(`${API_URL}/employees`);
  return handleResponse(res);
};

export const getTeam = async () => {
  const res = await tenantFetch(`${API_URL}/team`);
  return handleResponse(res);
};

export const assignAccessRole = async (id, role) => {
  const res = await tenantFetch(`${API_URL}/employees/${id}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  return handleResponse(res);
};

export const bulkImportEmployees = async (rows) => {
  const res = await tenantFetch(`${API_URL}/employees/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rows),
  });
  return handleResponse(res);
};

// ==========================================
// 2. Attendance Settings Service
// ==========================================

export const getAttendanceSettings = async () => {
  const res = await tenantFetch(`${API_URL}/attendance/settings`);
  return handleResponse(res);
};

export const updateAttendanceSettings = async (settings) => {
  const res = await tenantFetch(`${API_URL}/attendance/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  return handleResponse(res);
};

// ==========================================
// 3. Biometric Whitelisted Hardware Devices
// ==========================================

export const getDevices = async () => {
  const res = await tenantFetch(`${API_URL}/attendance/devices`);
  return handleResponse(res);
};

export const createDevice = async (device) => {
  const res = await tenantFetch(`${API_URL}/attendance/devices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(device),
  });
  return handleResponse(res);
};

export const deleteDevice = async (id) => {
  const res = await tenantFetch(`${API_URL}/attendance/devices/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
};

// ==========================================
// 4. IP Whitelisted Networks
// ==========================================

export const getNetworks = async () => {
  const res = await tenantFetch(`${API_URL}/attendance/networks`);
  return handleResponse(res);
};

export const createNetwork = async (net) => {
  const res = await tenantFetch(`${API_URL}/attendance/networks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(net),
  });
  return handleResponse(res);
};

export const deleteNetwork = async (id) => {
  const res = await tenantFetch(`${API_URL}/attendance/networks/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
};

// ==========================================
// 5. Hardware Device Users & Event Logs
// ==========================================

export const getBiometricUsers = async (ip) => {
  const res = await tenantFetch(
    `${API_URL}/attendance/biometric-users/${encodeURIComponent(ip)}`,
  );
  return handleResponse(res);
};

export const getAttendanceEvents = async () => {
  const res = await tenantFetch(`${API_URL}/attendance/events`);
  return handleResponse(res);
};

export const processBiometricLogs = async () => {
  const res = await tenantFetch(
    `${API_URL}/attendance/process-biometric-logs`,
    {
      method: "POST",
    },
  );
  return handleResponse(res);
};

export const submitRemoteClockIn = async (data) => {
  const res = await tenantFetch(`${API_URL}/attendance/remote-clockin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

// ==========================================
// 6. Attendance Calendar & Regularization
// ==========================================

export const getTeamCalendar = async (month, year) => {
  const res = await tenantFetch(
    `${API_URL}/attendance/team-calendar?month=${month}&year=${year}`,
  );
  return handleResponse(res);
};

export const getRegularizations = async () => {
  const res = await tenantFetch(`${API_URL}/attendance/regularizations`);
  return handleResponse(res);
};

export const requestRegularization = async (data) => {
  const res = await tenantFetch(`${API_URL}/attendance/regularizations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const processRegularization = async (id, status, approverRemarks) => {
  const res = await tenantFetch(`${API_URL}/attendance/regularizations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, approverRemarks }),
  });
  return handleResponse(res);
};

// ==========================================
// 7. Leave Policies & Plans
// ==========================================

export const getLeavePlans = async () => {
  const res = await tenantFetch(`${API_URL}/leave/plans`);
  return handleResponse(res);
};

export const createLeavePlan = async (plan) => {
  const res = await tenantFetch(`${API_URL}/leave/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plan),
  });
  return handleResponse(res);
};

export const getLeaveTypes = async () => {
  const res = await tenantFetch(`${API_URL}/leave/types`);
  return handleResponse(res);
};

export const getLeaveDefinitions = async (planId) => {
  const res = await tenantFetch(`${API_URL}/leave/plans/${planId}/definitions`);
  return handleResponse(res);
};

export const addLeaveDefinition = async (planId, data) => {
  const res = await tenantFetch(
    `${API_URL}/leave/plans/${planId}/definitions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  return handleResponse(res);
};

export const deleteLeaveDefinition = async (planId, leaveTypeId) => {
  const res = await tenantFetch(
    `${API_URL}/leave/plans/${planId}/definitions/${leaveTypeId}`,
    {
      method: "DELETE",
    },
  );
  return handleResponse(res);
};

export const getLeavePlanEmployees = async (planId) => {
  const res = await tenantFetch(`${API_URL}/leave/plans/${planId}/employees`);
  return handleResponse(res);
};

export const assignLeavePlanEmployees = async (planId, employeeIds) => {
  const res = await tenantFetch(`${API_URL}/leave/plans/${planId}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeIds }),
  });
  return handleResponse(res);
};

// ==========================================
// 8. Holidays Management
// ==========================================

export const getHolidays = async () => {
  const res = await tenantFetch(`${API_URL}/holidays`);
  return handleResponse(res);
};

export const createHoliday = async (holiday) => {
  const res = await tenantFetch(`${API_URL}/holidays`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(holiday),
  });
  return handleResponse(res);
};

export const deleteHoliday = async (id) => {
  const res = await tenantFetch(`${API_URL}/holidays/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
};

// ==========================================
// 9. Payroll & Salaries
// ==========================================

export const getSalaryStructures = async () => {
  const res = await tenantFetch(`${API_URL}/payroll/structures`);
  return handleResponse(res);
};

export const updateSalaryStructure = async (data) => {
  const res = await tenantFetch(`${API_URL}/payroll/structures`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const getPayslips = async () => {
  const res = await tenantFetch(`${API_URL}/payroll/payslips`);
  return handleResponse(res);
};

export const calculatePayroll = async (month, year) => {
  const res = await tenantFetch(`${API_URL}/payroll/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ month, year }),
  });
  return handleResponse(res);
};
