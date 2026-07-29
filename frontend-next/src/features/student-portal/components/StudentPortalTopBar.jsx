'use client';

import { LogOut, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';
import { useAuth } from '@/lib/auth/AuthContext';
import StudentAvatarLink from './StudentAvatarLink';

export default function StudentPortalTopBar({ sidebarOpen, onToggleSidebar }) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout?.();
    router.push('/login');
    localStorage.clear();
  };

  return (
    <header className="app-shell-topbar z-40 flex h-[var(--ui-shell-header-height)] w-full min-w-0 flex-none items-center justify-between gap-3 border-b border-neutral-100/80 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--ui-text-muted)] transition hover:bg-brand-soft hover:text-brand lg:hidden"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <NotificationBell />
        <StudentAvatarLink />
        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          aria-label="Log out"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 active:scale-95"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
