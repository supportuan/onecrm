'use client';

import ModuleGuard from '@/components/ModuleGuard';

export default function HrLayout({ children }) {
  return <ModuleGuard permissions={['VIEW_HR']}>{children}</ModuleGuard>;
}
