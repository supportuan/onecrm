'use client';

import ModuleGuard from '@/components/ModuleGuard';

export default function TrainingLayout({ children }) {
  return <ModuleGuard permissions={['VIEW_TRAINING', 'MANAGE_TRAINING']}>{children}</ModuleGuard>;
}
