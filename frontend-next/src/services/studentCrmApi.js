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

export const exportStudent = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${id}/export`));

export const archiveStudent = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${id}`, { method: 'DELETE' }));

export const listArchivedStudents = async ({ search, limit, page } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (limit) params.set('limit', String(limit));
  if (page) params.set('page', String(page));
  const qs = params.toString();
  return handleResponse(await tenantFetch(`${API_URL}/students/archived${qs ? `?${qs}` : ''}`));
};

export const restoreStudent = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${id}/restore`, { method: 'POST' }));

export const permanentlyDeleteStudent = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${id}/permanent`, { method: 'DELETE' }));

/** Download student export JSON in the browser, then optionally archive. */
export const downloadStudentExport = async (id, fileNameHint) => {
  const res = await exportStudent(id);
  const payload = res?.data ?? res;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  const safe = String(fileNameHint || `student_${id}`).replace(/[^a-zA-Z0-9._-]+/g, '_');
  a.href = url;
  a.download = `${safe}_${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return res;
};

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
export const deleteApplication = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${id}`, { method: 'DELETE' }));

export const bulkAssignApplications = async ({ applicationIds, assignedToId }) =>
  handleResponse(
    await tenantFetch(`${API_URL}/applications/bulk-assign`, json({ applicationIds, assignedToId }))
  );

export const advanceApplicationStage = async (id, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${id}/advance`, json(payload)));

// -------------------- Documents --------------------
export const addDocument = async (applicationId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/documents`, json(payload)));
export const updateDocument = async (applicationId, docId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/documents/${docId}`, putJson(payload)));
export const deleteDocument = async (applicationId, docId) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/documents/${docId}`, { method: 'DELETE' }));
export const uploadApplicationDocument = async (applicationId, docId, file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await tenantFetch(`${API_URL}/applications/${applicationId}/documents/${docId}/upload`, {
    method: 'POST',
    body: form,
  });
  return handleResponse(res);
};
export const notifyMissingDocs = async (applicationId) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/notify-missing-docs`, { method: 'POST' }));

// -------------------- Offer / Visa --------------------
export const upsertOffer = async (applicationId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/offer`, putJson(payload)));
export const uploadOfferLetter = async (applicationId, file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await tenantFetch(`${API_URL}/applications/${applicationId}/offer/upload`, {
    method: 'POST',
    body: form,
  });
  return handleResponse(res);
};
export const upsertVisa = async (applicationId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/visa`, putJson(payload)));
export const uploadVisaDocument = async (applicationId, file, label) => {
  const form = new FormData();
  form.append('file', file);
  if (label) form.append('label', label);
  const res = await tenantFetch(`${API_URL}/applications/${applicationId}/visa/upload`, {
    method: 'POST',
    body: form,
  });
  return handleResponse(res);
};
export const addVisaDocument = async (applicationId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/visa/documents`, json(payload)));
export const updateVisaDocument = async (applicationId, docId, payload) =>
  handleResponse(
    await tenantFetch(`${API_URL}/applications/${applicationId}/visa/documents/${docId}`, putJson(payload)),
  );
export const uploadVisaChecklistDocument = async (applicationId, docId, file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await tenantFetch(
    `${API_URL}/applications/${applicationId}/visa/documents/${docId}/upload`,
    { method: 'POST', body: form },
  );
  return handleResponse(res);
};
export const deleteVisaDocument = async (applicationId, docId) =>
  handleResponse(
    await tenantFetch(`${API_URL}/applications/${applicationId}/visa/documents/${docId}`, {
      method: 'DELETE',
    }),
  );

// -------------------- Application tasks --------------------
export const listApplicationTasks = async (applicationId) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/tasks`));
export const createApplicationTask = async (applicationId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/tasks`, json(payload)));
export const updateApplicationTask = async (applicationId, taskId, payload) =>
  handleResponse(
    await tenantFetch(`${API_URL}/applications/${applicationId}/tasks/${taskId}`, putJson(payload)),
  );
export const deleteApplicationTask = async (applicationId, taskId) =>
  handleResponse(
    await tenantFetch(`${API_URL}/applications/${applicationId}/tasks/${taskId}`, { method: 'DELETE' }),
  );

// -------------------- Application discussions --------------------
export const listApplicationComments = async (applicationId) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/comments`));
export const createApplicationComment = async (applicationId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/comments`, json(payload)));
export const updateApplicationComment = async (applicationId, commentId, payload) =>
  handleResponse(
    await tenantFetch(`${API_URL}/applications/${applicationId}/comments/${commentId}`, putJson(payload)),
  );
export const deleteApplicationComment = async (applicationId, commentId) =>
  handleResponse(
    await tenantFetch(`${API_URL}/applications/${applicationId}/comments/${commentId}`, { method: 'DELETE' }),
  );

export const getChecklist = async (country, university) => {
  const params = new URLSearchParams({ country });
  if (university) params.set('university', university);
  return handleResponse(await tenantFetch(`${API_URL}/checklist?${params.toString()}`));
};

export const getProcessStages = async (country) => {
  const params = country ? `?country=${encodeURIComponent(country)}` : '';
  return handleResponse(await tenantFetch(`${API_URL}/process-stages${params}`));
};

export const listChecklistTemplates = async () =>
  handleResponse(await tenantFetch(`${API_URL}/checklist-templates`));

export const createChecklistTemplate = async (payload) =>
  handleResponse(await tenantFetch(`${API_URL}/checklist-templates`, json(payload)));

export const updateChecklistTemplate = async (id, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/checklist-templates/${id}`, putJson(payload)));

export const deleteChecklistTemplate = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/checklist-templates/${id}`, { method: 'DELETE' }));

export const listWorkflowTemplates = async ({ countryId } = {}) => {
  const params = new URLSearchParams();
  if (countryId) params.set('countryId', String(countryId));
  const qs = params.toString();
  return handleResponse(await tenantFetch(`${API_URL}/workflow-templates${qs ? `?${qs}` : ''}`));
};

export const getWorkflowTemplate = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/workflow-templates/${id}`));

export const createWorkflowTemplate = async (payload) =>
  handleResponse(await tenantFetch(`${API_URL}/workflow-templates`, json(payload)));

export const updateWorkflowTemplate = async (id, payload) =>
  handleResponse(
    await tenantFetch(`${API_URL}/workflow-templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  );

export const deleteWorkflowTemplate = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/workflow-templates/${id}`, { method: 'DELETE' }));

export const cloneWorkflowTemplate = async (id, payload = {}) =>
  handleResponse(await tenantFetch(`${API_URL}/workflow-templates/${id}/clone`, json(payload)));

export const resetWorkflowTemplate = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/workflow-templates/${id}/reset`, json({})));

export const saveWorkflowProgress = async (applicationId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/workflow-progress`, putJson(payload)));

export const listVisaTracking = async () =>
  handleResponse(await tenantFetch(`${API_URL}/visa-tracking`));

export const respondToOffer = async (applicationId, decision) =>
  handleResponse(
    await tenantFetch(`${API_URL}/applications/${applicationId}/offer/decision`, json({ decision }))
  );

// -------------------- Payments --------------------
export const getApplicationReadiness = async (applicationId) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/readiness`));

export const listApplicationFees = async (applicationId) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/fees`));

export const upsertApplicationFee = async (applicationId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/applications/${applicationId}/fees`, json(payload)));

export const listMyPayments = async () => handleResponse(await tenantFetch(`${API_URL}/payments/me`));

export const getPaymentReceipt = async (paymentId) =>
  handleResponse(await tenantFetch(`${API_URL}/payments/${paymentId}/receipt`));

export const createPaymentOrder = async (applicationId, feeId) =>
  handleResponse(
    await tenantFetch(`${API_URL}/applications/${applicationId}/payments/create-order`, json({ feeId }))
  );

export const verifyPayment = async (applicationId, payload) =>
  handleResponse(
    await tenantFetch(`${API_URL}/applications/${applicationId}/payments/verify`, json(payload))
  );

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
export const getFormOptions = async () => handleResponse(await tenantFetch(`${API_URL}/form-options`));
export const updateMyStudent = async (payload) =>
  handleResponse(await tenantFetch(`${API_URL}/students/me`, putJson(payload)));
export const uploadMyProfilePhoto = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await tenantFetch(`${API_URL}/students/me/profile-photo`, {
    method: 'POST',
    body: form,
  });
  return handleResponse(res);
};
export const listMyApplications = async () =>
  handleResponse(await tenantFetch(`${API_URL}/applications/me`));

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

export const uploadStudentUniversityOfferLetter = async (studentId, universityId, file, applicationId) => {
  const form = new FormData();
  form.append('file', file);
  if (applicationId) form.append('applicationId', String(applicationId));
  const res = await tenantFetch(`${API_URL}/students/${studentId}/universities/${universityId}/offer-letter`, {
    method: 'POST',
    body: form,
  });
  return handleResponse(res);
};

export const listStudentStudyPlans = async (studentId) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${studentId}/study-plans`));

export const createStudentStudyPlan = async (studentId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${studentId}/study-plans`, json(payload)));

export const updateStudentStudyPlan = async (studentId, planId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${studentId}/study-plans/${planId}`, putJson(payload)));

export const removeStudentStudyPlan = async (studentId, planId) =>
  handleResponse(await tenantFetch(`${API_URL}/students/${studentId}/study-plans/${planId}`, { method: 'DELETE' }));

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
