'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  CreditCard,
  UserRound,
  PanelLeftClose,
} from 'lucide-react';
import { StudentPortalBrand, StudentPortalLogo } from './StudentPortalBrand';
import { SIDEBAR_OPEN, SIDEBAR_COLLAPSED } from '@/lib/layout-shell';

export { SIDEBAR_OPEN, SIDEBAR_COLLAPSED };

const NAV = [
  { label: 'Applications', href: '/applicant/applications', icon: FileText },
  { label: 'Payments', href: '/applicant/payments', icon: CreditCard },
  { label: 'Profile', href: '/applicant/profile/view', icon: UserRound },
];

export default function StudentPortalSidebar({ sidebarOpen, onToggleSidebar }) {
  const pathname = usePathname();
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
    </aside>
  );
}
