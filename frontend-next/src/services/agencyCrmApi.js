import authFetch from '@/lib/api';

const API_URL = '/api/agency-crm';
const PUBLIC_URL = '/api/agency-crm/public';

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

export const getStatistics = async ({ agencyPartnerId } = {}) => {
  const params = new URLSearchParams();
  if (agencyPartnerId) params.set('agencyPartnerId', String(agencyPartnerId));
  const qs = params.toString();
  return handleResponse(await tenantFetch(`${API_URL}/statistics${qs ? `?${qs}` : ''}`));
};

export const listPartners = async ({ search, status } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  return handleResponse(await tenantFetch(`${API_URL}/partners?${params.toString()}`));
};

export const getPartner = async (id) => handleResponse(await tenantFetch(`${API_URL}/partners/${id}`));
export const getMyPartner = async () => handleResponse(await tenantFetch(`${API_URL}/partners/me`));
export const provisionMyPartner = async () => handleResponse(await tenantFetch(`${API_URL}/partners/provision`, { method: 'POST' }));
export const createPartner = async (payload) => handleResponse(await tenantFetch(`${API_URL}/partners`, json(payload)));
export const updatePartner = async (id, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/partners/${id}`, putJson(payload)));

export const advanceOnboarding = async (id, stage) =>
  handleResponse(await tenantFetch(`${API_URL}/partners/${id}/onboarding`, json({ stage })));

export const signAgreement = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/partners/${id}/sign-agreement`, { method: 'POST' }));

export const submitOnboardingDocs = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/partners/${id}/submit-docs`, { method: 'POST' }));

export const updatePartnerStatus = async (id, status) =>
  handleResponse(await tenantFetch(`${API_URL}/partners/${id}/status`, putJson({ status })));

export const listAgencyLeads = async ({ page, limit, search, agencyPartnerId } = {}) => {
  const params = new URLSearchParams();
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  if (search) params.set('search', search);
  if (agencyPartnerId) params.set('agencyPartnerId', String(agencyPartnerId));
  return handleResponse(await tenantFetch(`${API_URL}/leads?${params.toString()}`));
};

export const listAgencyApplications = async ({ page, limit, search, agencyPartnerId } = {}) => {
  const params = new URLSearchParams();
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  if (search) params.set('search', search);
  if (agencyPartnerId) params.set('agencyPartnerId', String(agencyPartnerId));
  return handleResponse(await tenantFetch(`${API_URL}/applications?${params.toString()}`));
};

export const createReferral = async (payload) =>
  handleResponse(await tenantFetch(`${API_URL}/referrals`, json(payload)));

export const listCommissions = async ({ page, limit, status, agencyPartnerId } = {}) => {
  const params = new URLSearchParams();
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  if (status) params.set('status', status);
  if (agencyPartnerId) params.set('agencyPartnerId', String(agencyPartnerId));
  return handleResponse(await tenantFetch(`${API_URL}/commissions?${params.toString()}`));
};

export const getCommissionStatement = async ({ agencyPartnerId, period } = {}) => {
  const params = new URLSearchParams();
  if (agencyPartnerId) params.set('agencyPartnerId', String(agencyPartnerId));
  if (period) params.set('period', period);
  return handleResponse(await tenantFetch(`${API_URL}/commissions/statement?${params.toString()}`));
};

export const createCommission = async (payload) =>
  handleResponse(await tenantFetch(`${API_URL}/commissions`, json(payload)));
export const updateCommission = async (id, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/commissions/${id}`, putJson(payload)));

export const listCommissionRules = async (agencyPartnerId) => {
  const params = new URLSearchParams();
  if (agencyPartnerId) params.set('agencyPartnerId', String(agencyPartnerId));
  return handleResponse(await tenantFetch(`${API_URL}/commission-rules?${params.toString()}`));
};

export const saveCommissionRule = async (payload) =>
  handleResponse(await tenantFetch(`${API_URL}/commission-rules`, json(payload)));

export const deleteCommissionRule = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/commission-rules/${id}`, { method: 'DELETE' }));

export const listPartnerDocuments = async (partnerId) =>
  handleResponse(await tenantFetch(`${API_URL}/partners/${partnerId}/documents`));

export const uploadPartnerDocument = async (partnerId, file, meta = {}) => {
  const form = new FormData();
  form.append('file', file);
  if (meta.type) form.append('type', meta.type);
  if (meta.notes) form.append('notes', meta.notes);
  return handleResponse(await tenantFetch(`${API_URL}/partners/${partnerId}/documents/upload`, { method: 'POST', body: form }));
};

export const deletePartnerDocument = async (partnerId, docId) =>
  handleResponse(await tenantFetch(`${API_URL}/partners/${partnerId}/documents/${docId}`, { method: 'DELETE' }));

export const listPartnerActivities = async (partnerId) =>
  handleResponse(await tenantFetch(`${API_URL}/partners/${partnerId}/activities`));

export const logPartnerActivity = async (partnerId, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/partners/${partnerId}/activities`, json(payload)));

export const sendAgentBroadcast = async (payload) =>
  handleResponse(await tenantFetch(`${API_URL}/broadcasts`, json(payload)));

export const resolvePublicReferralCode = async (code) =>
  handleResponse(await fetch(`${PUBLIC_URL}/referral/${encodeURIComponent(code)}`));
