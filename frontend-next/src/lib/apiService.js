const AUTH_API_BASE = "/api/auth";
const jsonHeaders = { "Content-Type": "application/json" };

async function jsonRequest(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { ...jsonHeaders, ...init.headers },
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.message || body?.error || "Request failed";
    const error = new Error(message);
    error.response = response;
    error.body = body;
    throw error;
  }

  return body;
}

export async function login({ email, password }) {
  return jsonRequest(`${AUTH_API_BASE}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(refreshToken) {
  if (!refreshToken) return null;
  return jsonRequest(`${AUTH_API_BASE}/logout`, {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function refreshAuthToken(refreshToken) {
  if (!refreshToken) throw new Error("Missing refresh token");
  return jsonRequest(`${AUTH_API_BASE}/refresh-token`, {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function forgotPassword(email) {
  return jsonRequest(`${AUTH_API_BASE}/forgot-password`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token, newPassword) {
  return jsonRequest(`${AUTH_API_BASE}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}
