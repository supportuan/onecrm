'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { PermissionsProvider } from '@/lib/auth/PermissionsContext';
import { AppearanceThemeSync } from '@/lib/stores/appearanceStore';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <AppearanceThemeSync />
        {children}
      </PermissionsProvider>
    </AuthProvider>
  );
}
