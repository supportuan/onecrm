'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import StudentPortalGuard from '../components/StudentPortalGuard';
import StudentPortalSidebar, { SIDEBAR_OPEN, SIDEBAR_COLLAPSED } from '../components/StudentPortalSidebar';
import StudentPortalTopBar from '../components/StudentPortalTopBar';
import StudentAutoPageHeading from '../components/StudentPageHeading';
import { StudentPortalLayoutProvider } from './StudentPortalLayoutContext';
import { STUDENT_SIDEBAR_STORAGE_KEY } from '@/lib/layout-shell';

const STORAGE_KEY = STUDENT_SIDEBAR_STORAGE_KEY;

export default function ApplicantLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isPolicyPage = pathname === '/applicant/accept-policy';
  const isReceiptPage = /\/applicant\/payments\/\d+\/receipt$/.test(pathname || '');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
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
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  if (isReceiptPage) {
    return <StudentPortalGuard>{children}</StudentPortalGuard>;
  }

  if (isPolicyPage) {
    return <StudentPortalGuard skipPolicyCheck>{children}</StudentPortalGuard>;
  }

  const sidebarWidth = mounted ? (sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_COLLAPSED) : SIDEBAR_OPEN;

  return (
    <StudentPortalGuard>
      <div className="student-portal app-dark app-type-scale h-screen overflow-hidden text-brand antialiased">
        <StudentPortalSidebar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <div
          className="fixed inset-y-0 right-0 flex flex-col transition-[left] duration-200 ease-out"
          style={{ left: sidebarWidth }}
        >
          <div className="z-20 flex-none">
            <StudentPortalTopBar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
          </div>
          <main className="app-main-content min-h-0 flex-1 w-full overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5 lg:px-6">
            <StudentAutoPageHeading />
            <StudentPortalLayoutProvider sidebarOpen={sidebarOpen}>
              {children}
            </StudentPortalLayoutProvider>
          </main>
        </div>
      </div>
    </StudentPortalGuard>
  );
}
