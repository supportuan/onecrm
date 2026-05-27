const API_URL = '/api/agent';

const tenantFetch = async (url, options = {}) => {
  const tenantId =
    typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'default-tenant' : 'default-tenant';
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'x-tenant-id': tenantId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `Request failed (${res.status})`);
  return data;
};

export const getAgentDashboard = async () => {
  const res = await tenantFetch(`${API_URL}/dashboard`);
  return handleResponse(res);
};

export const getAgentProfile = async () => {
  const res = await tenantFetch(`${API_URL}/profile`);
  return handleResponse(res);
};

export const updateAgentProfile = async (payload) => {
  const res = await tenantFetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const getAssociatedStudents = async () => {
  const res = await tenantFetch(`${API_URL}/students`);
  return handleResponse(res);
};

export const getAssociatedStudent = async (studentId) => {
  const res = await tenantFetch(`${API_URL}/students/${studentId}`);
  return handleResponse(res);
};

export const getStudentDocuments = async (studentId) => {
  const res = await tenantFetch(`${API_URL}/students/${studentId}/documents`);
  return handleResponse(res);
};

export const uploadStudentDocument = async (studentId, doc) => {
  const res = await tenantFetch(`${API_URL}/students/${studentId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  });
  return handleResponse(res);
};

export const getUniversityPocs = async () => {
  const res = await tenantFetch(`${API_URL}/university-pocs`);
  return handleResponse(res);
};

export const contactUniversityPoc = async (pocId, payload) => {
  const res = await tenantFetch(`${API_URL}/university-pocs/${pocId}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const getTuitionPayments = async () => {
  const res = await tenantFetch(`${API_URL}/payments`);
  return handleResponse(res);
};

export const createTuitionPayment = async (payload) => {
  const res = await tenantFetch(`${API_URL}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const listAgents = async () => {
  const res = await tenantFetch(`${API_URL}/agents`);
  return handleResponse(res);
};

export const onboardAgent = async (payload) => {
  const res = await tenantFetch(`${API_URL}/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const getContractTiers = async () => {
  const res = await tenantFetch(`${API_URL}/contract-tiers`);
  return handleResponse(res);
};
