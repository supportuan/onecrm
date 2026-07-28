'use client';

import { LogOut, Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';
import { useAuth } from '@/lib/auth/AuthContext';
import StudentAvatarLink from './StudentAvatarLink';

const PAGE_META = [
  { prefix: '/applicant/profile/edit', title: 'Edit profile' },
  { prefix: '/applicant/profile/view', title: 'Profile' },
  { prefix: '/applicant/messages', title: 'Messages' },
  { prefix: '/applicant/resources', title: 'Knowledge Hub' },
  { prefix: '/applicant/payments', title: 'Payments' },
  { prefix: '/applicant/applications', title: 'Applications' },
  { prefix: '/applicant/accept-policy', title: 'Accept policy' },
];

export default function StudentPortalTopBar({ sidebarOpen, onToggleSidebar }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { logout } = useAuth();
  const meta = PAGE_META.find((p) => pathname.startsWith(p.prefix)) || {
    title: 'Student portal',
  };

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
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--ui-text-muted)] transition hover:bg-brand-soft hover:text-brand lg:hidden"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>

        <h1
          className="app-title-gradient min-w-0 flex-1 truncate text-2xl font-semibold tracking-tight"
          style={{ fontSize: 'var(--type-page-title)' }}
        >
          {meta.title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <NotificationBell />
        <StudentAvatarLink />
        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          aria-label="Log out"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 active:scale-95"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
