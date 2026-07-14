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

export async function login({ email, password, type }) {
  return jsonRequest(`${AUTH_API_BASE}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password, ...(type ? { type } : {}) }),
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

export async function uploadProfilePhoto(file) {
  const { default: authFetch } = await import("@/lib/api");
  const form = new FormData();
  form.append("file", file);
  const response = await authFetch(`${AUTH_API_BASE}/profile-photo`, {
    method: "POST",
    body: form,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || body?.error || "Upload failed");
  }
  return body;
}
