'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import StaffAutoPageHeading from './StaffPageHeading';
import {
  SIDEBAR_COLLAPSED,
  SIDEBAR_OPEN,
  STAFF_SIDEBAR_STORAGE_KEY,
} from '@/lib/layout-shell';
import { isCrimsonModulePath } from '@/lib/module-themes';

const SoftBlobBackground = dynamic(() => import('./SoftBlobBackground'), {
  ssr: false,
});

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const stored = localStorage.getItem(STAFF_SIDEBAR_STORAGE_KEY);
        if (stored !== null) setSidebarOpen(stored === 'true');
      } catch {
        /* Ignore unavailable browser storage. */
      }
      setMounted(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((current) => {
      const next = !current;
      try {
        localStorage.setItem(STAFF_SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        /* Ignore unavailable browser storage. */
      }
      return next;
    });
  };

  const publicRoutes = [
    '/',
    '/login',
    '/student-login',
    '/agent-login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/change-password',
  ];

  // Student portal has its own sidebar + top bar — do not wrap with staff chrome
  // (otherwise students see Marketing "Add Lead" and a double fixed shell).
  const isStudentPortal = Boolean(pathname?.startsWith('/applicant'));
  const skipStaffShell = publicRoutes.includes(pathname) || isStudentPortal;

  if (skipStaffShell) {
    return (
      <div className={isStudentPortal ? 'app-dark h-full min-h-0' : 'min-h-screen'}>
        {children}
      </div>
    );
  }

  const sidebarWidth = mounted
    ? (sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_COLLAPSED)
    : SIDEBAR_OPEN;
  const isMarketingModule = Boolean(pathname?.startsWith('/marketing'));
  const isCrimsonModule = isCrimsonModulePath(pathname || '');

  return (
    <div
      className={`app-dark app-type-scale h-screen overflow-hidden bg-[var(--ui-bg-page)] text-[var(--ui-text)] ${
        isMarketingModule ? 'module-marketing' : ''
      } ${isCrimsonModule ? 'module-crimson' : ''}`}
    >
      <SoftBlobBackground offsetLeft={sidebarWidth} />
      <Sidebar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

      <div
        className="fixed inset-y-0 right-0 z-10 flex flex-col transition-[left] duration-200 ease-out"
        style={{ left: sidebarWidth }}
      >
        <div className="z-20 flex-none bg-[var(--ui-bg)]">
          <TopNavbar />
        </div>
        <main className="app-main-content min-h-0 flex-1 w-full overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 lg:px-8">
          <StaffAutoPageHeading />
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
