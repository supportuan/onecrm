'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import {
  SIDEBAR_COLLAPSED,
  SIDEBAR_OPEN,
  STAFF_SIDEBAR_STORAGE_KEY,
} from '@/lib/layout-shell';

const ApplicationWaveBlobs = () => (
  <div className="app-wave-blobs" aria-hidden="true">
    <svg viewBox="0 0 1200 360" preserveAspectRatio="none">
      <path
        className="app-wave-blob-primary"
        d="M0 258C136 176 248 302 402 229C557 156 655 76 818 143C972 207 1054 119 1200 76V360H0V258Z"
      />
      <path
        className="app-wave-blob-secondary"
        d="M0 304C181 232 301 342 478 270C656 198 727 174 876 226C1025 278 1091 196 1200 158V360H0V304Z"
      />
    </svg>
  </div>
);

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
        {isStudentPortal && <ApplicationWaveBlobs />}
        {children}
      </div>
    );
  }

  const sidebarWidth = mounted
    ? (sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_COLLAPSED)
    : SIDEBAR_OPEN;
  const isMarketingModule = Boolean(pathname?.startsWith('/marketing'));

  return (
    <div className={`app-dark h-screen overflow-hidden bg-[var(--ui-bg-page)] text-[var(--ui-text)] ${isMarketingModule ? 'module-marketing' : ''}`}>
      <ApplicationWaveBlobs />
      <Sidebar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

      <div
        className="fixed inset-y-0 right-0 flex flex-col transition-[left] duration-200 ease-out"
        style={{ left: sidebarWidth }}
      >
        <div className="z-20 flex-none border-b border-[var(--ui-border)] bg-[var(--ui-bg)]">
          <TopNavbar />
        </div>
        <main className="min-h-0 flex-1 w-full overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;