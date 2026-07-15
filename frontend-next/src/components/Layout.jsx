
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { StaffLayoutProvider } from './StaffLayoutContext';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  SIDEBAR_OPEN,
  SIDEBAR_COLLAPSED,
  STAFF_SIDEBAR_STORAGE_KEY,
} from '@/lib/layout-shell';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STAFF_SIDEBAR_STORAGE_KEY);
      if (stored !== null) setSidebarOpen(stored === 'true');
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STAFF_SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const publicRoutes = [
    '/',
    '/login',
    '/student-login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/change-password',
  ];

  const isPublicPage =
    publicRoutes.includes(pathname) ||
    pathname?.startsWith('/applicant') ||
    pathname?.startsWith('/super-admin');
  const isStudentPortal = user?.role === 'STUDENT';

  if (isPublicPage || isStudentPortal) {
    return (
      <div className="min-h-screen text-brand">
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="fixed inset-y-0 left-0 z-30">
        <Sidebar
          sidebarOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}

  return (
    <div className="h-screen overflow-hidden text-brand antialiased">
      <Sidebar
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggleSidebar={toggleSidebar}
      />

      <div
        className="fixed inset-y-0 right-0 flex flex-col transition-[left] duration-200 ease-out"
        style={{ left: sidebarWidth }}
      >
        <TopNavbar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <StaffLayoutProvider sidebarOpen={sidebarOpen}>
            {children}
          </StaffLayoutProvider>
        </main>
      </div>
    </div>
  );
};

export default Layout;
