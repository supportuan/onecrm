'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { PermissionsProvider } from '@/lib/auth/PermissionsContext';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <PermissionsProvider>{children}</PermissionsProvider>
    </AuthProvider>
  );
}
