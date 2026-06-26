
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

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

  const isApplicantPortal = pathname?.startsWith('/applicant');
  // Print / document-render routes are chromeless on purpose so Ctrl+P captures
  // only the document body. Match by suffix to keep the rule extensible.
  const isPrintRoute = !!pathname && /\/print(\/|$)/.test(pathname);
  const isPublicPage = publicRoutes.includes(pathname) || isApplicantPortal || isPrintRoute;

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 min-h-0 flex-col lg:ml-72">
        <div className="fixed inset-x-0 top-0 z-20 bg-slate-50 shadow-sm lg:left-72 lg:right-0">
          <TopNavbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        </div>

        <main className="flex-1 overflow-y-auto pt-[108px] px-4 pb-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-slate-950/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
    </div>
  );
};

export default Layout;