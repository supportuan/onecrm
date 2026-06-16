import authFetch from '@/lib/api';

const API_URL = '/api/crm-settings';

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error ${res.status}`);
  }
  return res.json();
};

const tenantHeaders = () => ({
  'x-tenant-id': typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'default-tenant' : 'default-tenant',
});

export const getFormOptions = async () =>
  handleResponse(await authFetch(`${API_URL}/form-options`, { headers: tenantHeaders() }));

export const getCatalogStats = async () =>
  handleResponse(await authFetch(`${API_URL}/catalog/stats`, { headers: tenantHeaders() }));

export const listCatalog = async ({ countryId, universityId, page = 1, limit = 50, search } = {}) => {
  const params = new URLSearchParams();
  if (countryId) params.set('countryId', String(countryId));
  if (universityId) params.set('universityId', String(universityId));
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (search) params.set('search', search);
  return handleResponse(await authFetch(`${API_URL}/catalog?${params.toString()}`, { headers: tenantHeaders() }));
};

export const listCountries = async () =>
  handleResponse(await authFetch(`${API_URL}/countries`, { headers: tenantHeaders() }));

export const listUniversities = async ({ countryId, page = 1, limit = 50, search } = {}) => {
  const params = new URLSearchParams();
  if (countryId) params.set('countryId', String(countryId));
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (search) params.set('search', search);
  return handleResponse(await authFetch(`${API_URL}/universities?${params.toString()}`, { headers: tenantHeaders() }));
};

export const createUniversity = async (payload) =>
  handleResponse(
    await authFetch(`${API_URL}/universities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...tenantHeaders() },
      body: JSON.stringify(payload),
    })
  );

export const listCourses = async ({ universityId, page = 1, limit = 50, search } = {}) => {
  if (!universityId) throw new Error('universityId is required');
  const params = new URLSearchParams();
  params.set('universityId', String(universityId));
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (search) params.set('search', search);
  return handleResponse(await authFetch(`${API_URL}/courses?${params.toString()}`, { headers: tenantHeaders() }));
};

export const listIndustries = async () =>
  handleResponse(await authFetch(`${API_URL}/industries`, { headers: tenantHeaders() }));
