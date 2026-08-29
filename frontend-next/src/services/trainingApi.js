import authFetch from '@/lib/api';

const API_URL = '/api/training';

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error ${res.status}`);
  }
  return res.json();
};

export const getTrainingDashboard = async () =>
  handleResponse(await authFetch(API_URL));

export const getTrainingCourse = async (id) =>
  handleResponse(await authFetch(`${API_URL}/courses/${id}`));

export const enrollInCourse = async (id) =>
  handleResponse(await authFetch(`${API_URL}/courses/${id}/enroll`, { method: 'POST' }));

export const completeTrainingLesson = async (id) =>
  handleResponse(await authFetch(`${API_URL}/lessons/${id}/complete`, { method: 'POST' }));

export const listTrainingAdmin = async () =>
  handleResponse(await authFetch(`${API_URL}/admin/courses`));

export const createTrainingCourse = async (body) =>
  handleResponse(
    await authFetch(`${API_URL}/admin/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );

export const updateTrainingCourse = async (id, body) =>
  handleResponse(
    await authFetch(`${API_URL}/admin/courses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );

export const deleteTrainingCourse = async (id) =>
  handleResponse(await authFetch(`${API_URL}/admin/courses/${id}`, { method: 'DELETE' }));

export const addTrainingLesson = async (courseId, body) =>
  handleResponse(
    await authFetch(`${API_URL}/admin/courses/${courseId}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );

export const updateTrainingLesson = async (id, body) =>
  handleResponse(
    await authFetch(`${API_URL}/admin/lessons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );

export const deleteTrainingLesson = async (id) =>
  handleResponse(await authFetch(`${API_URL}/admin/lessons/${id}`, { method: 'DELETE' }));

export const listTrainingEnrollments = async (courseId) =>
  handleResponse(await authFetch(`${API_URL}/admin/courses/${courseId}/enrollments`));

export const assignTrainingEnrollment = async (courseId, userId) =>
  handleResponse(
    await authFetch(`${API_URL}/admin/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }),
  );

export const removeTrainingEnrollment = async (id) =>
  handleResponse(await authFetch(`${API_URL}/admin/enrollments/${id}`, { method: 'DELETE' }));

export const searchTrainingUsers = async (q, audience) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (audience) params.set('audience', audience);
  return handleResponse(await authFetch(`${API_URL}/admin/users?${params.toString()}`));
};

export const listTrainingClasses = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.programType) params.set('programType', filters.programType);
  if (filters.deliveryMode) params.set('deliveryMode', filters.deliveryMode);
  const qs = params.toString();
  return handleResponse(await authFetch(`${API_URL}/admin/classes${qs ? `?${qs}` : ''}`));
};

export const getTrainingClass = async (id) =>
  handleResponse(await authFetch(`${API_URL}/classes/${id}`));

export const createTrainingClass = async (body) =>
  handleResponse(
    await authFetch(`${API_URL}/admin/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );

export const updateTrainingClass = async (id, body) =>
  handleResponse(
    await authFetch(`${API_URL}/admin/classes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );

export const deleteTrainingClass = async (id) =>
  handleResponse(await authFetch(`${API_URL}/admin/classes/${id}`, { method: 'DELETE' }));

export const addTrainingClassStudent = async (classId, userId) =>
  handleResponse(
    await authFetch(`${API_URL}/admin/classes/${classId}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }),
  );

export const removeTrainingClassStudent = async (seatId) =>
  handleResponse(await authFetch(`${API_URL}/admin/seats/${seatId}`, { method: 'DELETE' }));

export const setTrainingSeatPayment = async (seatId, paymentStatus) =>
  handleResponse(
    await authFetch(`${API_URL}/admin/seats/${seatId}/payment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus }),
    }),
  );
