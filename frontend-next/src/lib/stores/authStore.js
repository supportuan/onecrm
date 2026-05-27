import { useState, useEffect } from 'react';

let mockUser = null;

const listeners = new Set();

function notifyListeners() {
  listeners.forEach((l) => l(mockUser));
}

export function useAuthStore() {
  const [user, setUser] = useState(mockUser);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            mockUser = data.user;
            notifyListeners();
          }
        }
      } catch (err) {
        console.error('Failed to sync authentication with backend:', err);
      }
    };
    fetchMe();
  }, []);

  useEffect(() => {
    listeners.add(setUser);
    return () => {
      listeners.delete(setUser);
    };
  }, []);

  const login = async (userData, token) => {
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
    mockUser = userData;
    notifyListeners();
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
    mockUser = null;
    notifyListeners();
  };

  const setRole = async (newRole) => {
    if (!mockUser) return;
    mockUser = { ...mockUser, role: newRole };
    notifyListeners();

    try {
      await fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: mockUser?.email || 'jane.admin@onecrm.com' }),
      });
    } catch (err) {
      console.error('Role override sync failure:', err);
    }
  };

  return { user, login, logout, setRole };
}
