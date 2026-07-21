'use client';

import ModuleGuard from '@/components/ModuleGuard';

export default function ResourcesLayout({ children }) {
  return <ModuleGuard permissions={['VIEW_RESOURCES', 'MANAGE_RESOURCES']}>{children}</ModuleGuard>;
}
