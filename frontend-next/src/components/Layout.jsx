'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { WorkspaceProvider } from '../lib/workspaceContext';
import { Menu } from 'lucide-react';

const LayoutContent = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isPortal =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/change-password' ||
    pathname === '/register';

  if (isPortal) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-neutral-50 text-neutral-900 overflow-y-auto">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-neutral-50 text-neutral-900 w-full">
      <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <button
        type="button"
        className="fixed top-4 left-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 shadow-sm lg:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 min-h-0 w-auto flex-col lg:ml-72">
        <main className="flex-1 w-auto overflow-y-auto px-4 pb-8 pt-4 sm:px-6 lg:px-8 lg:pt-8">
          <div className="w-auto">{children}</div>
        </main>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/15 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
    </div>
  );
};

const Layout = ({ children }) => {
  return (
    <WorkspaceProvider>
      <LayoutContent>{children}</LayoutContent>
    </WorkspaceProvider>
  );
};

export default Layout;
