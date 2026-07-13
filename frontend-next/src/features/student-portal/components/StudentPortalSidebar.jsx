'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  LogOut,
  CreditCard,
  UserRound,
  PanelLeftClose,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { StudentPortalBrand, StudentPortalLogo } from './StudentPortalBrand';
import { SIDEBAR_OPEN, SIDEBAR_COLLAPSED, initials } from '@/lib/layout-shell';

export { SIDEBAR_OPEN, SIDEBAR_COLLAPSED };

const NAV = [
  { label: 'Applications', href: '/applicant/applications', icon: FileText },
  { label: 'Payments', href: '/applicant/payments', icon: CreditCard },
  { label: 'Profile', href: '/applicant/profile/view', icon: UserRound },
];

export default function StudentPortalSidebar({ sidebarOpen, onToggleSidebar }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout?.();
    router.push('/student-login');
    localStorage.clear();
  };

  const width = sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_COLLAPSED;

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex h-screen flex-col overflow-hidden border-r border-neutral-200/70 bg-white transition-[width] duration-200 ease-out"
      style={{ width }}
    >
      <div
        className={`flex-none flex items-center border-b border-neutral-100/80 ${
          sidebarOpen ? 'justify-between gap-2 px-4 h-14' : 'justify-center h-14'
        }`}
      >
        {sidebarOpen ? (
          <>
            <StudentPortalBrand />
            <button
              type="button"
              onClick={onToggleSidebar}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-neutral-100"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <StudentPortalLogo className="h-8 w-8" />
          </button>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto sidebar-scrollbar py-3 ${sidebarOpen ? 'px-3' : 'px-2'}`}>
        <ul className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`group flex items-center text-[13px] font-medium transition-all duration-150 ${
                    sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
                  } rounded-xl ${
                    active
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-slate-600 hover:bg-brand-soft hover:text-brand'
                  }`}
                >
                  <Icon
                    className={`h-[17px] w-[17px] shrink-0 ${
                      active ? 'text-white' : 'text-slate-400 group-hover:text-brand'
                    }`}
                    strokeWidth={1.75}
                  />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={`flex-none border-t border-neutral-100/80 ${sidebarOpen ? 'p-3' : 'p-2'}`}>
        {sidebarOpen ? (
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-neutral-600 shadow-sm ring-1 ring-neutral-200/80">
              {initials(user?.fullName, user?.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-neutral-800 truncate">{user?.fullName || 'Student'}</p>
              <p className="text-[10px] text-neutral-400 truncate">{user?.email}</p>
            </div>
          </div>
        ) : (
          <div
            className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-50 text-[10px] font-semibold text-neutral-600 ring-1 ring-neutral-200/80"
            title={user?.fullName || user?.email}
          >
            {initials(user?.fullName, user?.email)}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          title={!sidebarOpen ? 'Log out' : undefined}
          className={`flex w-full items-center rounded-xl text-[13px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 ${
            sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
          }`}
        >
          <LogOut className="h-[17px] w-[17px] shrink-0" strokeWidth={1.75} />
          {sidebarOpen && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
