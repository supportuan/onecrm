'use client';

import { createContext, useContext } from 'react';

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
