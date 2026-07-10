'use client';

import { LogOut, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getStaffPageMeta } from '@/lib/staff-page-meta';
import NotificationBell from '@/components/NotificationBell';

const TopNavbar = ({ sidebarOpen, onToggleSidebar }) => {
  const pathname = usePathname() || '';
  const { user, logout } = useAuth();
  const { title } = getStaffPageMeta(pathname);

  return (
    <header className="z-40 flex h-14 w-full min-w-0 shrink-0 items-center justify-between gap-3 border-b border-neutral-200/70 bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 lg:hidden"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>

        <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-neutral-900">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <NotificationBell />

        {user && (
          <div className="hidden text-sm font-semibold text-neutral-700 sm:block">
            {user.fullName}
          </div>
        )}

        <button
          type="button"
          className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
          onClick={logout}
          title="Log out"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;
