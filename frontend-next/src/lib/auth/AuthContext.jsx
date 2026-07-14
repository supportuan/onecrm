'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login as loginRequest, logout as logoutRequest, refreshAuthToken as refreshTokenRequest } from '@/lib/apiService';
import {
  setAccessToken as syncAccessToken,
  registerSessionExpiredHandler,
  clearStoredSession,
} from '@/lib/auth/session';

const AuthContext = createContext({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  logout: () => {},
  refreshAuthToken: async () => {},
});

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncProfile = async () => {
    try {
      const { default: authFetch } = await import('@/lib/api');
      const res = await authFetch('/api/auth/me');
      if (!res.ok) {
        if (res.status !== 401) {
          console.warn('[Permissions Sync] Profile sync failed:', res.status);
        }
        return;
      }
      const data = await res.json();
      if (data?.success && data?.data) {
        setUser(data.data);
        localStorage.setItem('currentUser', JSON.stringify(data.data));
      }
    } catch (err) {
      console.warn('[Permissions Sync] Could not reach auth API:', err?.message || err);
    }
  };

  useEffect(() => {
    const storedAccess = localStorage.getItem('accessToken');
    const storedRefresh = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('currentUser');

    if (storedAccess && storedRefresh && storedUser) {
      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);
      setUser(JSON.parse(storedUser));
      syncAccessToken(storedAccess);
      syncProfile();
    }

    setLoading(false);
  }, []);

  // Re-fetch profile when the tab regains focus so super-admin module toggles
  // take effect without a manual re-login.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onFocus = () => {
      if (localStorage.getItem('accessToken')) syncProfile();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Keep authFetch in sync with React session state.
  useEffect(() => {
    syncAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      router.push('/login');
    });
  }, [router]);

  const saveSession = (userData, accessTokenValue, refreshTokenValue) => {
    setUser(userData);
    setAccessToken(accessTokenValue);
    setRefreshToken(refreshTokenValue);
    syncAccessToken(accessTokenValue);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('accessToken', accessTokenValue);
    localStorage.setItem('refreshToken', refreshTokenValue);
  };

  const clearSession = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    clearStoredSession();
  };

  const login = async ({ email, password }) => {
    const data = await loginRequest({ email, password });
    saveSession(data.data.user, data.data.accessToken, data.data.refreshToken);
    // Forced password change overrides every other landing page.
    if (data.data.mustChangePassword) {
      router.push('/change-password?forced=1');
    }
    return data.data;
  };

  const logout = () => {
    if (refreshToken) {
      logoutRequest(refreshToken).catch(() => null);
    }
    clearSession();
    router.push('/login');
  };

  const refreshAuthToken = async () => {
    if (!refreshToken) return null;

    try {
      const data = await refreshTokenRequest(refreshToken);
      setAccessToken(data.data.accessToken);
      setRefreshToken(data.data.refreshToken);
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return data.data;
    } catch (error) {
      clearSession();
      return null;
    }
  };

  const updateUser = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem('currentUser', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(user && accessToken),
      loading,
      login,
      logout,
      refreshAuthToken,
      syncProfile,
      saveSession,
      updateUser,
    }),
    [user, accessToken, refreshToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
