import authFetch from '@/lib/api';

const API_URL = '/api/student-crm';

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error ${res.status}`);
  }
  return res.json();
};

const tenantFetch = async (url, options = {}) => {
  const tenantId =
    typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'default-tenant' : 'default-tenant';
  const headers = { ...options.headers, 'x-tenant-id': tenantId };
  return authFetch(url, { ...options, headers });
};

const json = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const putJson = (body) => ({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// -------------------- Students --------------------
export const listStudents = async ({ search, limit } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (limit) params.set('limit', String(limit));
  const res = await tenantFetch(`${API_URL}/students?${params.toString()}`);
  return handleResponse(res);
};

export const getStudent = async (id) => handleResponse(await tenantFetch(`${API_URL}/students/${id}`));
export const createStudent = async (payload) => handleResponse(await tenantFetch(`${API_URL}/students`, json(payload)));
export const updateStudent = async (id, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${id}`, putJson(payload)));

// -------------------- Applications --------------------
export const listApplications = async ({ studentId, stage, assignedToId, search, limit } = {}) => {
  const params = new URLSearchParams();
  if (studentId) params.set('studentId', String(studentId));
  if (stage) params.set('stage', stage);
  if (assignedToId) params.set('assignedToId', String(assignedToId));
  if (search) params.set('search', search);
  if (limit) params.set('limit', String(limit));
  const res = await tenantFetch(`${API_URL}/applications?${params.toString()}`);
  return handleResponse(res);
};

export const getApplication = async (id) => handleResponse(await tenantFetch(`${API_URL}/applications/${id}`));
export const createApplication = async (payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications`, json(payload)));
export const updateApplication = async (id, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${id}`, putJson(payload)));

export const advanceApplicationStage = async (id, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${id}/advance`, json(payload)));

// -------------------- Documents --------------------
export const addDocument = async (applicationId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/documents`, json(payload)));
export const updateDocument = async (applicationId, docId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/documents/${docId}`, putJson(payload)));
export const deleteDocument = async (applicationId, docId) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/documents/${docId}`, { method: 'DELETE' }));
export const notifyMissingDocs = async (applicationId) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/notify-missing-docs`, { method: 'POST' }));

// -------------------- Offer / Visa --------------------
export const upsertOffer = async (applicationId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/offer`, putJson(payload)));
export const upsertVisa = async (applicationId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/visa`, putJson(payload)));

export const getChecklist = async (country) =>
  handleResponse(await tenantFetch(`${API_URL}/checklist?country=${encodeURIComponent(country)}`));

// -------------------- Lead → Application --------------------
export const convertLeadToApplication = async (leadId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/from-lead/${leadId}`, json(payload)));

export const listPromotableLeads = async () =>
  handleResponse(await tenantFetch(`${API_URL}/leads/promotable`));

export const promoteLead = async (leadId, payload = {}) =>
  handleResponse(await tenantFetch(`${API_URL}/leads/${leadId}/promote`, json(payload)));

export const promoteAllLeads = async (password) =>
  handleResponse(await tenantFetch(`${API_URL}/leads/promote-all`, json({ password })));

export const listCounsellors = async () => handleResponse(await tenantFetch('/api/counsellors'));

export const getStatistics = async () => handleResponse(await tenantFetch(`${API_URL}/statistics`));

export const getMyStudent = async () => handleResponse(await tenantFetch(`${API_URL}/students/me`));
export const updateMyStudent = async (payload) =>
  handleResponse(await tenantFetch(`${API_URL}/students/me`, putJson(payload)));

export const patchStudentStatus = async (id, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${id}/status`, { method: 'PATCH', ...json(payload) }));

export const setStudentEnrolled = async (id, isEnrolled) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${id}/enrolled`, { method: 'PATCH', ...json({ isEnrolled }) }));

export const listStudentChecklists = async (studentId) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${studentId}/checklists`));

export const updateChecklistValue = async (studentId, checkListId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${studentId}/checklists/${checkListId}`, putJson(payload)));

export const listStudentUniversities = async (studentId) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${studentId}/universities`));

export const upsertStudentUniversity = async (studentId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${studentId}/universities`, putJson(payload)));

export const removeStudentUniversity = async (studentId, universityId) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${studentId}/universities/${universityId}`, { method: 'DELETE' }));

export const uploadFile = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'default-tenant' : 'default-tenant';
  const res = await authFetch('/api/uploads', {
    method: 'POST',
    headers: { 'x-tenant-id': tenantId },
    body: form,
  });
  return handleResponse(res);
};
