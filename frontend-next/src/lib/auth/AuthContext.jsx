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

  useEffect(() => {
    const storedAccess = localStorage.getItem('accessToken');
    const storedRefresh = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('currentUser');

    if (storedAccess && storedRefresh && storedUser) {
      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);
      setUser(JSON.parse(storedUser));
      syncAccessToken(storedAccess);

      import('@/lib/api')
        .then(({ default: authFetch }) => authFetch('/api/auth/me'))
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch profile');
        })
        .then((data) => {
          if (data?.success && data?.data) {
            setUser(data.data);
            localStorage.setItem('currentUser', JSON.stringify(data.data));
          }
        })
        .catch((err) => {
          console.error('[Permissions Sync] Failed to sync permissions on mount:', err);
        });
    }

    setLoading(false);
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
    }),
    [user, accessToken, refreshToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
