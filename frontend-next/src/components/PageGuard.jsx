'use client';

import ModuleGuard from '@/components/ModuleGuard';

/**
 * Page-level permission guard. Use inside HR (or other) layouts that already
 * enforce module access — this adds finer-grained capability checks per page.
 */
export default function PageGuard({ permissions, children, redirectTo = '/hr' }) {
  return (
    <ModuleGuard permissions={permissions} redirectTo={redirectTo}>
      {children}
    </ModuleGuard>
  );
}
