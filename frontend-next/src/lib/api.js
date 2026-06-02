import { refreshAuthToken as refreshTokenRequest } from "./apiService";

// authFetch: attaches access token and attempts a refresh on 401 responses
export async function authFetch(input, init = {}) {
  // on server, just proxy through
  if (typeof window === "undefined") return fetch(input, init);

  const makeRequest = async (accessToken) => {
    const headers = init.headers ? { ...init.headers } : {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    return fetch(input, { ...init, headers });
  };

  let accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  let res = await makeRequest(accessToken);

  if (res.status !== 401) return res;

  // Try refreshing tokens
  if (!refreshToken) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return res;
  }

  try {
    const json = await refreshTokenRequest(refreshToken);
    const newAccess = json?.data?.accessToken;
    const newRefresh = json?.data?.refreshToken;
    if (newAccess) {
      localStorage.setItem("accessToken", newAccess);
      accessToken = newAccess;
    }
    if (newRefresh) localStorage.setItem("refreshToken", newRefresh);

    // retry original request with new access token
    res = await makeRequest(accessToken);
    return res;
  } catch (err) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return res;
  }
}

export default authFetch;
