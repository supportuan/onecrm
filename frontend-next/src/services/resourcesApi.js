import authFetch from '@/lib/api';

const API_URL = '/api/resources';

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

export const listResources = async () => handleResponse(await tenantFetch(API_URL));

export const listPendingResources = async () =>
  handleResponse(await tenantFetch(`${API_URL}/pending`));

export const acknowledgeResource = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/${id}/acknowledge`, { method: 'POST' }));

export const listResourcesAdmin = async () =>
  handleResponse(await tenantFetch(`${API_URL}/admin`));

export const uploadResource = async ({
  file,
  name,
  description,
  requiresAcknowledgement,
  targetRoles,
  category,
  targetCountries,
  isPublished,
}) => {
  const form = new FormData();
  form.append('file', file);
  form.append('name', name);
  if (description) form.append('description', description);
  form.append('requiresAcknowledgement', requiresAcknowledgement ? 'true' : 'false');
  form.append('targetRoles', JSON.stringify(targetRoles || ['ALL']));
  form.append('category', category || 'INHOUSE');
  form.append('targetCountries', JSON.stringify(targetCountries || []));
  form.append('isPublished', isPublished === false ? 'false' : 'true');
  return handleResponse(
    await tenantFetch(`${API_URL}/admin`, {
      method: 'POST',
      body: form,
    }),
  );
};

export const updateResource = async (
  id,
  { file, name, description, requiresAcknowledgement, targetRoles, category, targetCountries, isPublished },
) => {
  const form = new FormData();
  if (file) form.append('file', file);
  if (name) form.append('name', name);
  if (description !== undefined) form.append('description', description);
  if (requiresAcknowledgement !== undefined) {
    form.append('requiresAcknowledgement', requiresAcknowledgement ? 'true' : 'false');
  }
  if (targetRoles) form.append('targetRoles', JSON.stringify(targetRoles));
  if (category) form.append('category', category);
  if (targetCountries) form.append('targetCountries', JSON.stringify(targetCountries));
  if (isPublished !== undefined) form.append('isPublished', isPublished ? 'true' : 'false');
  return handleResponse(
    await tenantFetch(`${API_URL}/admin/${id}`, {
      method: 'PUT',
      body: form,
    }),
  );
};

export const deleteResource = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/admin/${id}`, { method: 'DELETE' }));

export const listResourceAcknowledgements = async (id) =>
  handleResponse(await tenantFetch(`${API_URL}/admin/${id}/acknowledgements`));
