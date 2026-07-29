'use client';

import { createContext, useContext } from 'react';

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

export { StaffPageHeading, StaffAutoPageHeading as StaffAutoPageHeader } from './StaffPageHeading';
