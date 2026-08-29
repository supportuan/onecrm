import authFetch from '@/lib/api';

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
  }
  return data;
};

export const getOrgSettings = async () => {
  const res = await authFetch('/api/org/settings');
  return handleResponse(res);
};

export const updateOrgSettings = async (payload) => {
  const res = await authFetch('/api/org/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const uploadLoginBackground = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await authFetch('/api/org/settings/login-background', {
    method: 'POST',
    body: form,
  });
  return handleResponse(res);
};

export const deleteLoginBackground = async () => {
  const res = await authFetch('/api/org/settings/login-background', { method: 'DELETE' });
  return handleResponse(res);
};

export const uploadOrgLogo = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await authFetch('/api/org/settings/logo', {
    method: 'POST',
    body: form,
  });
  return handleResponse(res);
};

export const deleteOrgLogo = async () => {
  const res = await authFetch('/api/org/settings/logo', { method: 'DELETE' });
  return handleResponse(res);
};
