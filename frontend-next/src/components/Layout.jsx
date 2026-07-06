
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const SIDEBAR_OPEN = 240;
const SIDEBAR_COLLAPSED = 56;

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

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

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-[var(--ui-bg-page)] text-[var(--ui-text)]">
        {children}
      </div>
    );
  }

  const sidebarWidth = sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_COLLAPSED;

  return (
    <div className="h-screen overflow-hidden bg-[var(--ui-bg-page)] text-[var(--ui-text)]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-20 bg-black/10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="fixed inset-y-0 left-0 z-30">
        <Sidebar
          sidebarOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
      </div>

      <div
        className="fixed inset-x-0 top-0 z-40 bg-white"
        style={{ left: sidebarWidth }}
      >
        <TopNavbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      </div>

      <div
        className="fixed top-0 right-0 bottom-0 transition-[left] duration-200 ease-out"
        style={{ left: sidebarWidth }}
      >
        <main
          className="h-full w-full overflow-y-auto overflow-x-hidden px-6 pb-10 pt-[calc(var(--ui-header-height)+24px)] sm:px-8 lg:px-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
