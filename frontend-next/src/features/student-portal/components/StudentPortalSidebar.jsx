'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Command, GraduationCap, FileText, LogOut, CreditCard } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

const NAV = [
  { label: 'My Applications', href: '/applicant/applications', icon: FileText },
  { label: 'Payments', href: '/applicant/payments', icon: CreditCard },
  { label: 'My Profile', href: '/applicant/profile/view', icon: GraduationCap },
];

export default function StudentPortalSidebar({ sidebarOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout?.();
    router.push('/student-login');
    localStorage.clear();
  };

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex h-screen flex-col border-r border-neutral-200 bg-white text-neutral-800 transition-[width] duration-300 ease-in-out"
      style={{ width: sidebarOpen ? '288px' : '80px' }}
    >
      <div className="flex-none p-5 pb-3">
        <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900">
            <Command className="h-4 w-4" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">ONECRM</p>
              <p className="text-xs text-neutral-500 truncate">Student portal</p>
            </div>
          )}
        </div>
      </div>

      {sidebarOpen && (
        <div className="px-5 py-2 flex-none">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <p className="text-xs text-neutral-500">Logged in as</p>
            <p className="text-sm font-medium text-neutral-900 mt-0.5">Student</p>
            <p className="text-xs text-neutral-500 mt-1 truncate">{user?.fullName || user?.email}</p>
          </div>
        </div>
      )}

      <nav className={`flex-1 overflow-y-auto sidebar-scrollbar py-3 space-y-1 ${sidebarOpen ? 'px-5' : 'px-3'}`}>
        {sidebarOpen && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            My account
          </p>
        )}
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!sidebarOpen ? item.label : undefined}
              className={`flex items-center rounded-lg py-2.5 text-[13px] font-medium transition ${
                sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2'
              } ${
                active
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.5} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`flex-none border-t border-neutral-200 p-4 ${sidebarOpen ? '' : 'px-3'}`}>
        <button
          type="button"
          onClick={handleLogout}
          title={!sidebarOpen ? 'Log out' : undefined}
          className={`flex w-full items-center rounded-lg py-2.5 text-[13px] font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900 ${
            sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2'
          }`}
        >
          <LogOut className="h-[15px] w-[15px] shrink-0" strokeWidth={1.5} />
          {sidebarOpen && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
