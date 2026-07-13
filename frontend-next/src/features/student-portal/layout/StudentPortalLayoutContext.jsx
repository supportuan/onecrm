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
      <h1 className="text-[1.65rem] font-semibold tracking-tight text-brand">{title}</h1>
      {description && <p className={`${sp.body} max-w-2xl`}>{description}</p>}
    </header>
  );
}
