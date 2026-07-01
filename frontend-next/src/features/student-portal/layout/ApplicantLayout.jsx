'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, FileText, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import StudentPortalGuard from '../components/StudentPortalGuard';

const NAV = [
  { label: 'My Profile', href: '/applicant/profile/view', icon: GraduationCap },
  { label: 'My Application', href: '/applicant/applications', icon: FileText },
];

export default function ApplicantLayout({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isPolicyPage = pathname === '/applicant/accept-policy';

  if (isPolicyPage) {
    return <StudentPortalGuard skipPolicyCheck>{children}</StudentPortalGuard>;
  }

  return (
    <StudentPortalGuard>
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white shadow-sm">
          <div className="ui-container mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Student portal</p>
                <p className="text-xs text-neutral-500">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-neutral-600">{user?.fullName}</span>
              <button type="button" onClick={logout} className="ui-btn-secondary gap-2 py-2">
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
          <nav className="ui-container mx-auto flex max-w-6xl gap-2 px-6 pb-4">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="ui-page !min-h-0 !p-0">
          <div className="ui-container mx-auto max-w-6xl px-6 py-8">{children}</div>
        </main>
      </div>
    </StudentPortalGuard>
  );
}
