import { useState, useEffect } from 'react';

let mockUser = {
  id: 'usr_mock_123',
  name: 'Jane Admin',
  email: 'jane.admin@onecrm.com',
  role: 'SUPER_ADMIN',
  tenantSettings: {
    roles: {}
  }
};

const listeners = new Set();

export function useAuthStore() {
  const [user, setUser] = useState(mockUser);

  useEffect(() => {
    listeners.add(setUser);
    return () => {
      listeners.delete(setUser);
    };
  }, []);

  const logout = () => {
    console.log('Mock user logging out');
  };

  const setRole = (newRole) => {
    mockUser = { ...mockUser, role: newRole };
    listeners.forEach((l) => l(mockUser));
  };

  return { user, logout, setRole };
}
