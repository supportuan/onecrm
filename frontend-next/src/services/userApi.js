import authFetch from "@/lib/api";

const API_URL = "/api/users";

// Helper to handle responses
const handleResponse = async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }
  return res.json();
};

export const getUsers = async (role) => {
  const url = role ? `${API_URL}?role=${role}` : API_URL;
  const res = await authFetch(url);
  return handleResponse(res);
};

export const createUser = async (userData) => {
  // Map fields if needed, like generating a random password since backend requires a password
  // Wait, let's see what password backend requires.
  // The backend user.service.ts createUser requires password in payload!
  // In `admin-settings/Users.jsx`, it says: "Username will be email and random password will be sent automatically."
  // So we should generate a random password in the service or let frontend specify it.
  const payload = {
    ...userData,
    password: userData.password || Math.random().toString(36).slice(-10),
  };
  const res = await authFetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const deleteUser = async (id) => {
  const res = await authFetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
};

export const updateUser = async (id, userData) => {
  const res = await authFetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
};

export const getCounsellors = async () => {
  const res = await authFetch("/api/counsellors");
  return handleResponse(res);
};
