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
  document.cookie = 'accessToken=; Path=/; Max-Age=0; SameSite=Lax';
}

export function persistAccessTokenCookie(token) {
  if (typeof window === 'undefined' || !token) return;
  // Used by /uploads (img/src / Next rewrite) where Authorization headers are not sent.
  document.cookie = `accessToken=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
}

/** Append access_token for /uploads links opened in a new tab (no Authorization header). */
export function withUploadAuth(url) {
  if (!url || typeof url !== 'string') return url;
  // Opaque S3 refs / signed object URLs must not be rewritten
  if (url.startsWith('s3:')) return url;

  if (/^https?:\/\//i.test(url)) {
    try {
      const u = new URL(url);
      if (
        /\.amazonaws\.com$/i.test(u.hostname) ||
        u.searchParams.has('X-Amz-Algorithm') ||
        u.searchParams.has('X-Amz-Signature')
      ) {
        return url;
      }
      if (!u.pathname.includes('/uploads')) return url;
      const token = getAccessToken();
      if (!token) return url;
      u.searchParams.set('access_token', token);
      return u.toString();
    } catch {
      return url;
    }
  }

  if (!url.startsWith('/uploads')) return url;
  const token = getAccessToken();
  if (!token) return url;
  try {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const u = new URL(url, base);
    u.searchParams.set('access_token', token);
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}access_token=${encodeURIComponent(token)}`;
  }
}

export function expireSession() {
  clearStoredSession();
  onSessionExpired?.();
}
