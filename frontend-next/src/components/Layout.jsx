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

  const isPublicPage = publicRoutes.includes(pathname);

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
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
          // onToggleSidebar={() => setSidebarOpen(true)}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}

        />
      </div>

      <div className="fixed inset-x-0 top-0 z-40 bg-slate-50 shadow-sm">
        <TopNavbar />
      </div>
      <div
        className="fixed top-0 right-0 bottom-0 transition-all duration-300"
        style={{
          left: sidebarOpen ? '288px' : '80px',
        }}
      >
        <main className="h-full w-full overflow-y-auto overflow-x-hidden pt-[108px] px-4 pb-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;