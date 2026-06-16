import authFetch from '@/lib/api';

const API_URL = '/api/agency-crm';

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
export const createPartner = async (payload) => handleResponse(await tenantFetch(`${API_URL}/partners`, json(payload)));
export const updatePartner = async (id, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/partners/${id}`, putJson(payload)));

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

export const createCommission = async (payload) =>
  handleResponse(await tenantFetch(`${API_URL}/commissions`, json(payload)));
export const updateCommission = async (id, payload) =>
  handleResponse(await tenantFetch(`${API_URL}/commissions/${id}`, putJson(payload)));
