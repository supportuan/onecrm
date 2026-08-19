import authFetch from '@/lib/api';

const API_URL = '/api/crm-settings';

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error ${res.status}`);
  }
  return res.json();
};

const jsonHeaders = { 'Content-Type': 'application/json' };

export const getFormOptions = async () =>
  handleResponse(await authFetch(`${API_URL}/form-options`));

export const getCatalogStats = async () =>
  handleResponse(await authFetch(`${API_URL}/catalog/stats`));

export const listCatalog = async ({ countryId, universityId, page = 1, limit = 50, search } = {}) => {
  const params = new URLSearchParams();
  if (countryId) params.set('countryId', String(countryId));
  if (universityId) params.set('universityId', String(universityId));
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (search) params.set('search', search);
  return handleResponse(await authFetch(`${API_URL}/catalog?${params.toString()}`));
};

export const listCountries = async () =>
  handleResponse(await authFetch(`${API_URL}/countries`));

export const listUniversities = async ({ countryId, page = 1, limit = 50, search } = {}) => {
  const params = new URLSearchParams();
  if (countryId) params.set('countryId', String(countryId));
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (search) params.set('search', search);
  return handleResponse(await authFetch(`${API_URL}/universities?${params.toString()}`));
};

export const createUniversity = async (payload) =>
  handleResponse(
    await authFetch(`${API_URL}/universities`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    })
  );

/** Find existing university in a country or create it when the name is new. */
export const findOrCreateUniversity = async ({ countryId, name, city } = {}) => {
  if (!countryId || !name?.trim()) throw new Error('countryId and name are required');
  return handleResponse(
    await authFetch(`${API_URL}/universities/find-or-create`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ countryId, name: name.trim(), city }),
    })
  );
};

export const listCourses = async ({ universityId, page = 1, limit = 50, search } = {}) => {
  if (!universityId) throw new Error('universityId is required');
  const params = new URLSearchParams();
  params.set('universityId', String(universityId));
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (search) params.set('search', search);
  return handleResponse(await authFetch(`${API_URL}/courses?${params.toString()}`));
};

/** Find existing course under a university or create it when the name is new. */
export const findOrCreateCourse = async ({ universityId, name, level, duration } = {}) => {
  if (!universityId || !name?.trim()) throw new Error('universityId and name are required');
  return handleResponse(
    await authFetch(`${API_URL}/courses`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ universityId, name: name.trim(), level, duration }),
    })
  );
};

/** Paginate through all universities for a country (full catalog). */
export const fetchAllUniversitiesForCountry = async (countryId) => {
  const limit = 500;
  let page = 1;
  let all = [];
  let totalPages = 1;
  while (page <= totalPages) {
    const res = await listUniversities({ countryId, page, limit });
    const data = res?.data || {};
    all = all.concat(data.items || []);
    totalPages = data.totalPages || 1;
    page += 1;
  }
  return all;
};

/** Paginate through all courses for a university (full catalog). */
export const fetchAllCoursesForUniversity = async (universityId) => {
  const limit = 500;
  let page = 1;
  let all = [];
  let totalPages = 1;
  while (page <= totalPages) {
    const res = await listCourses({ universityId, page, limit });
    const data = res?.data || {};
    all = all.concat(data.items || []);
    totalPages = data.totalPages || 1;
    page += 1;
  }
  return all;
};

export const listIndustries = async ({ countryId } = {}) => {
  const params = new URLSearchParams();
  if (countryId) params.set('countryId', String(countryId));
  const qs = params.toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    return await handleResponse(
      await authFetch(`${API_URL}/industries${qs ? `?${qs}` : ''}`, {
        signal: controller.signal,
      })
    );
  } finally {
    clearTimeout(timer);
  }
};

export const listIndustrySubFields = async ({ countryId, industryId }) => {
  const params = new URLSearchParams();
  params.set('countryId', String(countryId));
  params.set('industryId', String(industryId));
  return handleResponse(
    await authFetch(`${API_URL}/industries/sub-fields?${params.toString()}`)
  );
};
