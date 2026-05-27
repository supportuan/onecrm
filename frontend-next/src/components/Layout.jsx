'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { WorkspaceProvider, useWorkspace } from '../lib/workspaceContext';

const LayoutContent = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeWorkspace } = useWorkspace();
  const pathname = usePathname();

  // If there is no active workspace or we are on the landing page, show full screen portal
  const isPortal = !activeWorkspace || pathname === '/';

  if (isPortal) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-slate-50 text-slate-900 w-full">
      <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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

const Layout = ({ children }) => {
  return (
    <WorkspaceProvider>
      <LayoutContent>{children}</LayoutContent>
    </WorkspaceProvider>
  );
};

export default Layout;


