const API_URL = '/api/student';

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
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
};

export const getStudentProfile = async () => {
  const res = await tenantFetch(`${API_URL}/profile`);
  return handleResponse(res);
};

export const getStudentDashboard = async () => {
  const res = await tenantFetch(`${API_URL}/dashboard`);
  return handleResponse(res);
};

export const getStudents = async () => {
  const res = await tenantFetch(`${API_URL}/students`);
  return handleResponse(res);
};
