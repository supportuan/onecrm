import authFetch from '@/lib/api';

const API_URL = '/api/notifications';

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

/** List recent in-app notifications for the current user. */
export const getNotifications = async ({ limit = 50, unreadOnly = false } = {}) => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (unreadOnly) params.set('unreadOnly', 'true');
  const res = await tenantFetch(`${API_URL}?${params.toString()}`);
  return handleResponse(res);
};

/** Lightweight unread count for the bell badge. */
export const getUnreadCount = async () => {
  const res = await tenantFetch(`${API_URL}/unread-count`);
  return handleResponse(res);
};

export const markRead = async (id) => {
  const res = await tenantFetch(`${API_URL}/${id}/read`, { method: 'PUT' });
  return handleResponse(res);
};

export const markAllRead = async () => {
  const res = await tenantFetch(`${API_URL}/read-all`, { method: 'PUT' });
  return handleResponse(res);
};

export const deleteNotification = async (id) => {
  const res = await tenantFetch(`${API_URL}/${id}`, { method: 'DELETE' });
  return handleResponse(res);
};

// --------- admin ---------

export const listTemplates = async () => {
  const res = await tenantFetch(`${API_URL}/admin/templates`);
  return handleResponse(res);
};

export const sendTestNotification = async (payload) => {
  const res = await tenantFetch(`${API_URL}/admin/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};
