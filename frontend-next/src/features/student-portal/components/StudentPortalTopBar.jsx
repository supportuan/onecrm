'use client';

import { LogOut, Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';
import { useAuth } from '@/lib/auth/AuthContext';
import StudentAvatarLink from './StudentAvatarLink';

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
  const { logout } = useAuth();
  const meta = PAGE_META.find((p) => pathname.startsWith(p.prefix)) || {
    title: 'Student portal',
  };

  const handleLogout = () => {
    logout?.();
    router.push('/student-login');
    localStorage.clear();
  };

  return (
    <header className="z-40 flex h-14 w-full min-w-0 flex-none items-center justify-between gap-3 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
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

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <NotificationBell />
        <StudentAvatarLink />
        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          aria-label="Log out"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#0b2a5b] transition hover:bg-[#e8eef7] active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
