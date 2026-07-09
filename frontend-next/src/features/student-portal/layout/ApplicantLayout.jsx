'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import StudentPortalGuard from '../components/StudentPortalGuard';
import StudentPortalSidebar from '../components/StudentPortalSidebar';
import StudentPortalTopBar from '../components/StudentPortalTopBar';

export default function ApplicantLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const isPolicyPage = pathname === '/applicant/accept-policy';

  if (isPolicyPage) {
    return <StudentPortalGuard skipPolicyCheck>{children}</StudentPortalGuard>;
  }

  return (
    <StudentPortalGuard>
      <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
        <StudentPortalSidebar sidebarOpen={sidebarOpen} />

        <div
          className="fixed top-0 right-0 bottom-0 transition-all duration-300"
          style={{ left: sidebarOpen ? '288px' : '80px' }}
        >
          <div className="fixed inset-x-0 top-0 z-40 bg-slate-50">
            <StudentPortalTopBar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
          </div>

          <main className="h-full w-full overflow-y-auto overflow-x-hidden pt-[88px] px-4 pb-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </StudentPortalGuard>
  );
}
