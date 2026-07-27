'use client';

import { createContext, useContext } from 'react';
import { sp } from '../student-portal-ui';

const StudentPortalLayoutContext = createContext({ sidebarOpen: true });

export function StudentPortalLayoutProvider({ sidebarOpen, children }) {
  return (
    <StudentPortalLayoutContext.Provider value={{ sidebarOpen }}>
      {children}
    </StudentPortalLayoutContext.Provider>
  );
}

export function useStudentPortalLayout() {
  return useContext(StudentPortalLayoutContext);
}

export function StudentPageHeader({ title, description }) {
  const { sidebarOpen } = useStudentPortalLayout();
  if (!sidebarOpen) return null;

  return (
    <header className="mb-6 space-y-2">
      <h1
        className="text-2xl font-semibold tracking-tight text-brand"
        style={{ fontSize: 'var(--type-page-title)' }}
      >
        {title}
      </h1>
      {description && <p className={`${sp.body} w-full text-xs`} style={{ fontSize: '12px' }}>{description}</p>}
    </header>
  );
}
