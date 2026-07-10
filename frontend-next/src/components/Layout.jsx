'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { useAuth } from '@/lib/auth/AuthContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

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
      <div className="min-h-screen bg-[#f4f4f5] text-neutral-900">
        {children}
      </div>
    );
  }

  const sidebarWidth = mounted
    ? sidebarOpen
      ? SIDEBAR_OPEN
      : SIDEBAR_COLLAPSED
    : SIDEBAR_OPEN;

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="fixed inset-y-0 left-0 z-30">
        <Sidebar
          sidebarOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}

        />
      </div>

      <div className="fixed inset-x-0 top-0 z-40 bg-slate-50 shadow-sm">
        <TopNavbar />
      </div>
      <div
        className="fixed inset-y-0 right-0 flex flex-col transition-[left] duration-200 ease-out"
        style={{ left: sidebarWidth }}
      >
        <TopNavbar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <StaffLayoutProvider sidebarOpen={sidebarOpen}>
            <StaffAutoPageHeader />
            {children}
          </StaffLayoutProvider>
        </main>
      </div>
    </div>
  );
};

export default Layout;
