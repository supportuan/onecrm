'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import StudentPortalGuard from '../components/StudentPortalGuard';
import StudentPortalSidebar, { SIDEBAR_OPEN, SIDEBAR_COLLAPSED } from '../components/StudentPortalSidebar';
import StudentPortalTopBar from '../components/StudentPortalTopBar';
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
      <div className="student-portal h-screen overflow-hidden bg-[#f4f4f5] text-neutral-900 antialiased">
        <StudentPortalSidebar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <div
          className="fixed inset-y-0 right-0 flex flex-col transition-[left] duration-200 ease-out"
          style={{ left: sidebarWidth }}
        >
          <StudentPortalTopBar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

          <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden px-4 pb-10 pt-6 sm:px-6 lg:px-8">
            <StudentPortalLayoutProvider sidebarOpen={sidebarOpen}>
              {children}
            </StudentPortalLayoutProvider>
          </main>
        </div>
      </div>
    </StudentPortalGuard>
  );
}
