import { refreshAuthToken as refreshTokenRequest } from "./apiService";
import { getAccessToken, expireSession, setAccessToken } from "./auth/session";

let refreshInFlight = null;

async function refreshSession(refreshToken) {
  if (!refreshInFlight) {
    refreshInFlight = refreshTokenRequest(refreshToken).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

// authFetch: attaches access token and attempts a refresh on 401 responses
export async function authFetch(input, init = {}) {
  // on server, just proxy through
  if (typeof window === "undefined") return fetch(input, init);

  const makeRequest = async (token) => {
    const headers = init.headers ? { ...init.headers } : {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(input, { ...init, headers });
  };

  let accessToken = getAccessToken();
  const refreshToken =
    typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

  let res = await makeRequest(accessToken);

  if (res.status !== 401) return res;

  // Try refreshing tokens
  if (!refreshToken) {
    expireSession();
    return res;
  }

  try {
    const json = await refreshSession(refreshToken);
    const newAccess = json?.data?.accessToken;
    const newRefresh = json?.data?.refreshToken;
    if (newAccess) {
      localStorage.setItem("accessToken", newAccess);
      accessToken = newAccess;
      setAccessToken(newAccess);
    }
    if (newRefresh) localStorage.setItem("refreshToken", newRefresh);

    if (!newAccess) {
      expireSession();
      return res;
    }

    // retry original request with new access token
    res = await makeRequest(accessToken);
    if (res.status === 401) {
      expireSession();
    }
    return res;
  } catch (err) {
    expireSession();
    return res;
  }
}

export default authFetch;
