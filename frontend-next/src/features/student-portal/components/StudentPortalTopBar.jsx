'use client';

import { LogOut, Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';
import { useAuth } from '@/lib/auth/AuthContext';
import { initials } from '@/lib/layout-shell';

const PAGE_META = [
  { prefix: '/applicant/profile/edit', title: 'Edit profile' },
  { prefix: '/applicant/profile/view', title: 'Profile' },
  { prefix: '/applicant/payments', title: 'Payments' },
  { prefix: '/applicant/applications', title: 'Applications' },
  { prefix: '/applicant/accept-policy', title: 'Accept policy' },
];

export default function StudentPortalTopBar({ sidebarOpen, onToggleSidebar }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user, logout } = useAuth();
  const meta = PAGE_META.find((p) => pathname.startsWith(p.prefix)) || {
    title: 'Student portal',
  };

  const handleLogout = () => {
    logout?.();
    router.push('/student-login');
    localStorage.clear();
  };

  return (
    <header className="flex-none z-40 flex h-14 w-full min-w-0 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-brand-muted transition hover:bg-brand-soft hover:text-brand lg:hidden"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>

        <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-brand">
          {meta.title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationBell />

        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand ring-1 ring-brand/10">
            {initials(user?.fullName, user?.email)}
          </div>
          <div className="min-w-0 max-w-[160px]">
            <p className="truncate text-xs font-semibold text-brand">
              {user?.fullName || 'Student'}
            </p>
            <p className="truncate text-[10px] text-brand-muted">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          className="inline-flex h-9 items-center gap-2 rounded-xl px-2.5 text-[13px] font-medium text-brand-muted transition hover:bg-brand-soft hover:text-brand"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
