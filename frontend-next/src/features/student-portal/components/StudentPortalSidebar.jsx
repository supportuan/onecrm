'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  CreditCard,
  UserRound,
  Library,
  MessageSquare,
} from 'lucide-react';
import { SidebarBrandHeader } from '@/components/AppBrand';
import { SIDEBAR_OPEN, SIDEBAR_COLLAPSED } from '@/lib/layout-shell';

export { SIDEBAR_OPEN, SIDEBAR_COLLAPSED };

const NAV = [
  { label: 'Applications', href: '/applicant/applications', icon: FileText },
  { label: 'Messages', href: '/applicant/messages', icon: MessageSquare },
  { label: 'Knowledge Hub', href: '/applicant/resources', icon: Library },
  { label: 'Payments', href: '/applicant/payments', icon: CreditCard },
  { label: 'Profile', href: '/applicant/profile/view', icon: UserRound },
];

export default function StudentPortalSidebar({ sidebarOpen, onToggleSidebar }) {
  const pathname = usePathname();
  const width = sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_COLLAPSED;

  return (
    <aside
      className="app-sidebar-with-waves fixed inset-y-0 left-0 z-30 flex h-screen flex-col overflow-hidden border-r border-neutral-200/70 bg-white transition-[width] duration-200 ease-out"
      style={{ width }}
    >
      <div className="app-sidebar-wave-blobs" aria-hidden="true">
        <svg viewBox="0 0 240 320" preserveAspectRatio="none">
          <path
            className="app-wave-blob-primary"
            d="M0 132C43 89 85 160 128 116C171 72 197 104 240 58V320H0V132Z"
          />
          <path
            className="app-wave-blob-secondary"
            d="M0 196C48 148 92 226 145 174C190 130 216 165 240 142V320H0V196Z"
          />
        </svg>
      </div>

      <SidebarBrandHeader
        sidebarOpen={sidebarOpen}
        onToggleSidebar={onToggleSidebar}
        homeHref="/applicant/applications"
      />

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
                  className={`app-nav-item group flex items-center text-[13px] font-medium ${
                    sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
                  } rounded-xl ${
                    active
                      ? 'app-nav-item-active bg-brand text-white'
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

      {sidebarOpen ? (
        <div className="relative z-[1] flex-none border-t border-neutral-100/80 px-3 py-3">
          <p className="text-[10px] font-semibold leading-snug text-neutral-500">
            © AUNTech (V 3.3.1)
          </p>
          <p className="mt-0.5 text-[10px] font-medium leading-snug text-neutral-400">
            Optimized services &amp; performance enhancements.
          </p>
        </div>
      ) : null}
    </aside>
  );
}
