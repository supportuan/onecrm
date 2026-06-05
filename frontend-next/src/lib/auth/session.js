/**
 * Bridge between AuthContext (React state) and authFetch (plain fetch helper).
 * Keeps the access token in sync so API calls always use the same session
 * the UI believes is active.
 */

let accessTokenRef = null;
let onSessionExpired = null;

export function setAccessToken(token) {
  accessTokenRef = token;
}

export function registerSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

export function getAccessToken() {
  if (accessTokenRef) return accessTokenRef;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
}

export function clearStoredSession() {
  accessTokenRef = null;
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('currentUser');
}

export function expireSession() {
  clearStoredSession();
  onSessionExpired?.();
}
