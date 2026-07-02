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

export const getEmployees = async (status) => {
  const params = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await tenantFetch(`${API_URL}/employees${params}`);
  return handleResponse(res);
};

export const getEmployeeById = async (id) => {
  const res = await tenantFetch(`${API_URL}/employees/${id}`);
  return handleResponse(res);
};

export const updateEmployee = async (id, data) => {
  const res = await tenantFetch(`${API_URL}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const getEmployeeDocuments = async (employeeId) => {
  const res = await tenantFetch(`${API_URL}/employees/${employeeId}/documents`);
  return handleResponse(res);
};

export const uploadEmployeeDocument = async (employeeId, file, meta = {}) => {
  const form = new FormData();
  form.append('file', file);
  if (meta.type) form.append('type', meta.type);
  if (meta.notes) form.append('notes', meta.notes);
  if (meta.expiresAt) form.append('expiresAt', meta.expiresAt);
  const res = await tenantFetch(`${API_URL}/employees/${employeeId}/documents/upload`, {
    method: 'POST',
    body: form,
  });
  return handleResponse(res);
};

export const deleteEmployeeDocument = async (employeeId, docId) => {
  const res = await tenantFetch(`${API_URL}/employees/${employeeId}/documents/${docId}`, {
    method: 'DELETE',
  });
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

export const getAttendanceEvents = async (date) => {
  const qs = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await tenantFetch(`${API_URL}/attendance/events${qs}`);
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

export const getMyAttendance = async (month, year) => {
  const params = new URLSearchParams();
  if (month) params.set("month", String(month));
  if (year) params.set("year", String(year));
  const q = params.toString();
  const res = await tenantFetch(`${API_URL}/attendance/me${q ? `?${q}` : ""}`);
  return handleResponse(res);
};

// ==========================================
// 6. Attendance regularization
// ==========================================

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

export const getHrDashboardSummary = async () => {
  const res = await tenantFetch(`${API_URL}/dashboard/summary`);
  return handleResponse(res);
};

export const getHrMe = async () => {
  const res = await tenantFetch(`${API_URL}/me`);
  return handleResponse(res);
};

export const getMyLeaveRequests = async () => {
  const res = await tenantFetch(`${API_URL}/leave/requests?mine=true`);
  return handleResponse(res);
};

export const getPendingLeaveRequests = async () => {
  const res = await tenantFetch(`${API_URL}/leave/requests?status=PENDING`);
  return handleResponse(res);
};

export const createLeaveRequest = async (data) => {
  const res = await tenantFetch(`${API_URL}/leave/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const processLeaveRequest = async (id, data) => {
  const res = await tenantFetch(`${API_URL}/leave/requests/${id}/process`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const cancelLeaveRequest = async (id) => {
  const res = await tenantFetch(`${API_URL}/leave/requests/${id}/cancel`, {
    method: "PUT",
  });
  return handleResponse(res);
};

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

export const deleteLeavePlan = async (planId) => {
  const res = await tenantFetch(`${API_URL}/leave/plans/${planId}`, {
    method: "DELETE",
  });
  return handleResponse(res);
};

export const getLeaveTypes = async () => {
  const res = await tenantFetch(`${API_URL}/leave/types`);
  return handleResponse(res);
};

export const createLeaveType = async (data) => {
  const res = await tenantFetch(`${API_URL}/leave/types`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateLeaveType = async (id, data) => {
  const res = await tenantFetch(`${API_URL}/leave/types/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteLeaveType = async (id) => {
  const res = await tenantFetch(`${API_URL}/leave/types/${id}`, {
    method: "DELETE",
  });
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

export const removeLeavePlanEmployee = async (planId, employeeId) => {
  const res = await tenantFetch(
    `${API_URL}/leave/plans/${planId}/employees/${employeeId}`,
    { method: "DELETE" },
  );
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

// ==========================================
// 10. Payroll Deductions
// ==========================================

export const getPayrollDeductions = async (month, year) => {
  const params = new URLSearchParams();
  if (month) params.append("month", month);
  if (year) params.append("year", year);
  const res = await tenantFetch(`${API_URL}/payroll/deductions?${params}`);
  return handleResponse(res);
};

export const upsertPayrollDeduction = async (data) => {
  const res = await tenantFetch(`${API_URL}/payroll/deductions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

// ==========================================
// 11. Onboarding Checklist
// ==========================================

export const getOnboardingChecklists = async () => {
  const res = await tenantFetch(`${API_URL}/onboarding`);
  return handleResponse(res);
};

export const getOnboardingChecklist = async (id) => {
  const res = await tenantFetch(`${API_URL}/onboarding/${id}`);
  return handleResponse(res);
};

export const createOnboardingChecklist = async (data) => {
  const res = await tenantFetch(`${API_URL}/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateOnboardingItem = async (checklistId, itemId, data) => {
  const res = await tenantFetch(`${API_URL}/onboarding/${checklistId}/items/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

// ==========================================
// 12. Offer Letters
// ==========================================

export const getOfferLetters = async () => {
  const res = await tenantFetch(`${API_URL}/offer-letters`);
  return handleResponse(res);
};

export const createOfferLetter = async (data) => {
  const res = await tenantFetch(`${API_URL}/offer-letters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateOfferLetterStatus = async (id, status) => {
  const res = await tenantFetch(`${API_URL}/offer-letters/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
};

export const acceptOfferLetter = async (id, onboardingTemplateId) => {
  const res = await tenantFetch(`${API_URL}/offer-letters/${id}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(onboardingTemplateId ? { onboardingTemplateId } : {}),
  });
  return handleResponse(res);
};

export const rejectOfferLetter = async (id, notes) => {
  const res = await tenantFetch(`${API_URL}/offer-letters/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notes ? { notes } : {}),
  });
  return handleResponse(res);
};

export const getOfferLetterById = async (id) => {
  const res = await tenantFetch(`${API_URL}/offer-letters/${id}`);
  return handleResponse(res);
};

export const renderOfferLetter = async (id) => {
  const res = await tenantFetch(`${API_URL}/offer-letters/${id}/render`);
  return handleResponse(res);
};

export const getOfferLetterTemplates = async () => {
  const res = await tenantFetch(`${API_URL}/offer-letters/templates`);
  return handleResponse(res);
};

export const createOfferLetterTemplate = async (data) => {
  const res = await tenantFetch(`${API_URL}/offer-letters/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateOfferLetterTemplate = async (id, data) => {
  const res = await tenantFetch(`${API_URL}/offer-letters/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteOfferLetterTemplate = async (id) => {
  const res = await tenantFetch(`${API_URL}/offer-letters/templates/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
};

// ==========================================
// 13. Interview Scheduling & Feedback
// ==========================================

export const getInterviews = async () => {
  const res = await tenantFetch(`${API_URL}/interviews`);
  return handleResponse(res);
};

export const scheduleInterview = async (data) => {
  const res = await tenantFetch(`${API_URL}/interviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateInterviewStatus = async (id, status) => {
  const res = await tenantFetch(`${API_URL}/interviews/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
};

export const submitInterviewFeedback = async (id, feedback) => {
  const res = await tenantFetch(`${API_URL}/interviews/${id}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedback),
  });
  return handleResponse(res);
};

export const rescheduleInterview = async (id, data) => {
  const res = await tenantFetch(`${API_URL}/interviews/${id}/reschedule`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const uploadRecruitmentFile = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await tenantFetch(`${API_URL}/recruitment/upload`, {
    method: "POST",
    body: form,
  });
  return handleResponse(res);
};

// ==========================================
// 14. Job Postings & Candidate Tracking
// ==========================================

export const getJobPostings = async () => {
  const res = await tenantFetch(`${API_URL}/jobs`);
  return handleResponse(res);
};

export const createJobPosting = async (data) => {
  const res = await tenantFetch(`${API_URL}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateJobPostingStatus = async (id, status) => {
  const res = await tenantFetch(`${API_URL}/jobs/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
};

export const updateJobPosting = async (id, data) => {
  const res = await tenantFetch(`${API_URL}/jobs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const getCandidates = async (jobId) => {
  const params = new URLSearchParams();
  if (jobId) params.append("jobId", jobId);
  const res = await tenantFetch(`${API_URL}/candidates?${params}`);
  return handleResponse(res);
};

export const addCandidate = async (data) => {
  const res = await tenantFetch(`${API_URL}/candidates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateCandidateStage = async (id, stage, status, notes) => {
  const res = await tenantFetch(`${API_URL}/candidates/${id}/stage`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage, status, notes }),
  });
  return handleResponse(res);
};

export const updateCandidate = async (id, data) => {
  const res = await tenantFetch(`${API_URL}/candidates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateCandidateStatus = async (id, status, notes) => {
  const res = await tenantFetch(`${API_URL}/candidates/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, notes }),
  });
  return handleResponse(res);
};

export const uploadCandidateResume = async (candidateId, file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await tenantFetch(`${API_URL}/candidates/${candidateId}/resume`, {
    method: "POST",
    body: form,
  });
  return handleResponse(res);
};

export const getCandidateStageEvents = async (candidateId) => {
  const res = await tenantFetch(`${API_URL}/candidates/${candidateId}/stage-events`);
  return handleResponse(res);
};

export const getOnboardingTemplates = async () => {
  const res = await tenantFetch(`${API_URL}/onboarding/templates`);
  return handleResponse(res);
};

export const createOnboardingTemplate = async (data) => {
  const res = await tenantFetch(`${API_URL}/onboarding/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteOnboardingTemplate = async (id) => {
  const res = await tenantFetch(`${API_URL}/onboarding/templates/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
};

export const uploadOnboardingItemAttachment = async (checklistId, itemId, file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await tenantFetch(
    `${API_URL}/onboarding/${checklistId}/items/${itemId}/attachment`,
    { method: "POST", body: form },
  );
  return handleResponse(res);
};

// ==========================================
// 15. Processing Performance Metrics
// ==========================================

export const getProcessingMetrics = async () => {
  const res = await tenantFetch(`${API_URL}/metrics/processing`);
  return handleResponse(res);
};

export const addProcessingMetric = async (data) => {
  const res = await tenantFetch(`${API_URL}/metrics/processing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

// ==========================================
// 16. KPI Definitions & Metrics
// ==========================================

export const getKPIDefinitions = async (role) => {
  const params = new URLSearchParams();
  if (role) params.append("role", role);
  const res = await tenantFetch(`${API_URL}/kpi/definitions?${params}`);
  return handleResponse(res);
};

export const createKPIDefinition = async (data) => {
  const res = await tenantFetch(`${API_URL}/kpi/definitions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateKPIDefinition = async (id, data) => {
  const res = await tenantFetch(`${API_URL}/kpi/definitions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteKPIDefinition = async (id) => {
  const res = await tenantFetch(`${API_URL}/kpi/definitions/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
};

export const getKPIMetrics = async (role, period) => {
  const params = new URLSearchParams();
  if (role) params.append("role", role);
  if (period) params.append("period", period);
  const res = await tenantFetch(`${API_URL}/kpi/metrics?${params}`);
  return handleResponse(res);
};

export const recordKPIMetric = async (data) => {
  const res = await tenantFetch(`${API_URL}/kpi/metrics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

// ==========================================
// 17. Marketing Performance
// ==========================================

export const getMarketingPerformance = async (period) => {
  const params = new URLSearchParams();
  if (period) params.append("period", period);
  const res = await tenantFetch(`${API_URL}/performance/marketing?${params}`);
  return handleResponse(res);
};

export const addMarketingPerformance = async (data) => {
  const res = await tenantFetch(`${API_URL}/performance/marketing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

// ==========================================
// 18. Counsellor Performance
// ==========================================

export const getCounsellorPerformance = async (period) => {
  const params = new URLSearchParams();
  if (period) params.append("period", period);
  const res = await tenantFetch(`${API_URL}/performance/counsellors?${params}`);
  return handleResponse(res);
};

export const addCounsellorPerformance = async (data) => {
  const res = await tenantFetch(`${API_URL}/performance/counsellors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

// ==========================================
// 19. Performance Reviews
// ==========================================

export const getPerformanceReviews = async (search) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  const query = params.toString();
  const res = await tenantFetch(`${API_URL}/performance-reviews${query ? `?${query}` : ""}`);
  return handleResponse(res);
};

export const createPerformanceReview = async (data) => {
  const res = await tenantFetch(`${API_URL}/performance-reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updatePerformanceReview = async (id, data) => {
  const res = await tenantFetch(`${API_URL}/performance-reviews/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};
