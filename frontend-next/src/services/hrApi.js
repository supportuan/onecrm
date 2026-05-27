const API_URL = '/api/hr';

// Helper to handle responses
const handleResponse = async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }
  return res.json();
};

// Tenant Fetch Helper — sends auth cookie + optional bearer token
const tenantFetch = async (url, options = {}) => {
  const tenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenantId') || 'default-tenant') : 'default-tenant';
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const headers = {
    ...options.headers,
    'x-tenant-id': tenantId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers, credentials: 'include' });
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
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  return handleResponse(res);
};

export const bulkImportEmployees = async (rows) => {
  const res = await tenantFetch(`${API_URL}/employees/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rows),
  });
  return handleResponse(res);
};

export const createEmployee = async (employee) => {
  const res = await tenantFetch(`${API_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee),
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
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(device),
  });
  return handleResponse(res);
};

export const deleteDevice = async (id) => {
  const res = await tenantFetch(`${API_URL}/attendance/devices/${id}`, {
    method: 'DELETE',
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(net),
  });
  return handleResponse(res);
};

export const deleteNetwork = async (id) => {
  const res = await tenantFetch(`${API_URL}/attendance/networks/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
};

// ==========================================
// 5. Hardware Device Users & Event Logs
// ==========================================

export const getBiometricUsers = async (ip) => {
  const res = await tenantFetch(`${API_URL}/attendance/biometric-users/${encodeURIComponent(ip)}`);
  return handleResponse(res);
};

export const getAttendanceEvents = async () => {
  const res = await tenantFetch(`${API_URL}/attendance/events`);
  return handleResponse(res);
};

export const processBiometricLogs = async () => {
  const res = await tenantFetch(`${API_URL}/attendance/process-biometric-logs`, {
    method: 'POST',
  });
  return handleResponse(res);
};

export const submitRemoteClockIn = async (data) => {
  const res = await tenantFetch(`${API_URL}/attendance/remote-clockin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

// ==========================================
// 6. Attendance Calendar & Regularization
// ==========================================

export const getTeamCalendar = async (month, year) => {
  const res = await tenantFetch(`${API_URL}/attendance/team-calendar?month=${month}&year=${year}`);
  return handleResponse(res);
};

export const getRegularizations = async () => {
  const res = await tenantFetch(`${API_URL}/attendance/regularizations`);
  return handleResponse(res);
};

export const requestRegularization = async (data) => {
  const res = await tenantFetch(`${API_URL}/attendance/regularizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const processRegularization = async (id, status, approverRemarks) => {
  const res = await tenantFetch(`${API_URL}/attendance/regularizations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const res = await tenantFetch(`${API_URL}/leave/plans/${planId}/definitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteLeaveDefinition = async (planId, leaveTypeId) => {
  const res = await tenantFetch(`${API_URL}/leave/plans/${planId}/definitions/${leaveTypeId}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
};

export const getLeavePlanEmployees = async (planId) => {
  const res = await tenantFetch(`${API_URL}/leave/plans/${planId}/employees`);
  return handleResponse(res);
};

export const assignLeavePlanEmployees = async (planId, employeeIds) => {
  const res = await tenantFetch(`${API_URL}/leave/plans/${planId}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(holiday),
  });
  return handleResponse(res);
};

export const deleteHoliday = async (id) => {
  const res = await tenantFetch(`${API_URL}/holidays/${id}`, {
    method: 'DELETE',
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
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, year }),
  });
  return handleResponse(res);
};

// ==========================================
// 10. Extended Lifecycle & Documents
// ==========================================

export const updateEmployee = async (id, data) => {
  const res = await tenantFetch(`${API_URL}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const getEmployeeDocuments = async (id) => {
  const res = await tenantFetch(`${API_URL}/employees/${id}/documents`);
  return handleResponse(res);
};

export const uploadEmployeeDocument = async (id, doc) => {
  const res = await tenantFetch(`${API_URL}/employees/${id}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  });
  return handleResponse(res);
};

export const deleteEmployeeDocument = async (id, docId) => {
  const res = await tenantFetch(`${API_URL}/employees/${id}/documents/${docId}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
};

// ==========================================
// 11. Multi-level Leave Request Workflows
// ==========================================

export const getLeaveRequests = async () => {
  const res = await tenantFetch(`${API_URL}/leave/requests`);
  return handleResponse(res);
};

export const applyLeaveRequest = async (data) => {
  const res = await tenantFetch(`${API_URL}/leave/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const processLeaveApproval = async (id, role, status, remarks) => {
  const res = await tenantFetch(`${API_URL}/leave/requests/${id}/approve`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, status, remarks }),
  });
  return handleResponse(res);
};

export const getLeaveBalancesReport = async () => {
  const res = await tenantFetch(`${API_URL}/leave/balances-report`);
  return handleResponse(res);
};

// ==========================================
// 12. Recruitment Persistence & Candidates
// ==========================================

export const getCandidates = async () => {
  const res = await tenantFetch(`${API_URL}/recruitment/candidates`);
  return handleResponse(res);
};

export const createCandidate = async (data) => {
  const res = await tenantFetch(`${API_URL}/recruitment/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateCandidate = async (id, data) => {
  const res = await tenantFetch(`${API_URL}/recruitment/candidates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

// ==========================================
// 13. HR Groups
// ==========================================

export const getGroups = async () => {
  const res = await tenantFetch(`${API_URL}/groups`);
  return handleResponse(res);
};

export const createGroup = async (group) => {
  const res = await tenantFetch(`${API_URL}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(group),
  });
  return handleResponse(res);
};

// ==========================================
// 14. Business Goals
// ==========================================

export const getBusinessGoals = async () => {
  const res = await tenantFetch(`${API_URL}/business-goals`);
  return handleResponse(res);
};

export const createBusinessGoal = async (goal) => {
  const res = await tenantFetch(`${API_URL}/business-goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  return handleResponse(res);
};

export const linkBusinessGoalToHr = async (goalId) => {
  const res = await tenantFetch(`${API_URL}/business-goals/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalId }),
  });
  return handleResponse(res);
};

// ==========================================
// 15. Attendance Templates & Reports
// ==========================================

export const getAttendanceTemplates = async () => {
  const res = await tenantFetch(`${API_URL}/attendance/templates`);
  return handleResponse(res);
};

export const getAttendanceTemplate = async (id) => {
  const res = await tenantFetch(`${API_URL}/attendance/templates/${id}`);
  return handleResponse(res);
};

export const getAttendanceSummaryReport = async (month, year) => {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  if (year) params.set('year', year);
  const res = await tenantFetch(`${API_URL}/attendance/summary-report?${params}`);
  return handleResponse(res);
};

// ==========================================
// 16. Counselor & Marketing KPIs
// ==========================================

export const getCounselorMetrics = async (id) => {
  const res = await tenantFetch(`${API_URL}/counselors/${encodeURIComponent(id)}/metrics`);
  return handleResponse(res);
};

export const getMarketingTeamKpis = async (teamId) => {
  const res = await tenantFetch(`${API_URL}/marketing-teams/${encodeURIComponent(teamId)}/kpis`);
  return handleResponse(res);
};

// ==========================================
// 17. KPI Definitions & Performance Reviews
// ==========================================

export const getKpiDefinitions = async () => {
  const res = await tenantFetch(`${API_URL}/performance/kpis`);
  return handleResponse(res);
};

export const createKpiDefinition = async (kpi) => {
  const res = await tenantFetch(`${API_URL}/performance/kpis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(kpi),
  });
  return handleResponse(res);
};

export const getPerformanceReviews = async () => {
  const res = await tenantFetch(`${API_URL}/performance/reviews`);
  return handleResponse(res);
};

export const createPerformanceReview = async (review) => {
  const res = await tenantFetch(`${API_URL}/performance/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  return handleResponse(res);
};

export const updatePerformanceReview = async (id, data) => {
  const res = await tenantFetch(`${API_URL}/performance/reviews/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};
