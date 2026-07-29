import authFetch from '@/lib/api';

const API_URL = '/api/communication';

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP error ${res.status}`);
  }
  return data;
};

export const listConversations = async () => {
  const res = await authFetch(`${API_URL}/conversations`);
  return handleResponse(res);
};

export const getStudentThread = async (studentId) => {
  const res = await authFetch(`${API_URL}/students/${studentId}/messages`);
  return handleResponse(res);
};

export const sendStudentMessage = async (studentId, message) => {
  const res = await authFetch(`${API_URL}/students/${studentId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return handleResponse(res);
};

export const getMyMessages = async () => {
  const res = await authFetch(`${API_URL}/me/messages`);
  return handleResponse(res);
};

export const sendMyMessage = async (message) => {
  const res = await authFetch(`${API_URL}/me/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return handleResponse(res);
};
