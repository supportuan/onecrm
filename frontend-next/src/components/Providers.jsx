'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { PermissionsProvider } from '@/lib/auth/PermissionsContext';
import { BrandingProvider } from '@/lib/branding/BrandingContext';
import { AppearanceThemeSync } from '@/lib/stores/appearanceStore';

export default function Providers({ children }) {
  return (
    <BrandingProvider>
      <AuthProvider>
        <PermissionsProvider>
          <AppearanceThemeSync />
          {children}
        </PermissionsProvider>
      </AuthProvider>
    </BrandingProvider>
  );
}
