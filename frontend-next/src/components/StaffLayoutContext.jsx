'use client';

import { createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { getStaffPageMeta } from '@/lib/staff-page-meta';

const StaffLayoutContext = createContext({ sidebarOpen: true });

export function StaffLayoutProvider({ sidebarOpen, children }) {
  return (
    <StaffLayoutContext.Provider value={{ sidebarOpen }}>
      {children}
    </StaffLayoutContext.Provider>
  );
}

export function useStaffLayout() {
  return useContext(StaffLayoutContext);
}

export function StaffPageHeader({ title, description }) {
  const { sidebarOpen } = useStaffLayout();
  if (!sidebarOpen) return null;

  return (
    <header className="mb-4 space-y-1">
      <h1
        className="text-2xl font-semibold tracking-tight text-brand"
        style={{ fontSize: 'var(--type-page-title)' }}
      >
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-xs leading-snug text-neutral-500" style={{ fontSize: '12px' }}>{description}</p>
      )}
    </header>
  );
}

export function StaffAutoPageHeader() {
  const pathname = usePathname() || '';
  const { sidebarOpen } = useStaffLayout();
  const { title, description } = getStaffPageMeta(pathname);

  if (!sidebarOpen) return null;

  return <StaffPageHeader title={title} description={description} />;
}
