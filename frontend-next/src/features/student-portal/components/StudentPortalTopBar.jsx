'use client';

import Image from 'next/image';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';

const PAGE_META = [
  { prefix: '/applicant/profile/edit', title: 'Edit profile', description: 'Update your personal and study details.' },
  { prefix: '/applicant/profile/view', title: 'My profile', description: 'Your personal and study details on file.' },
  { prefix: '/applicant/payments', title: 'My payments', description: 'Fee receipts and payment history.' },
  { prefix: '/applicant/applications', title: 'My applications', description: 'Upload documents, pay fees, and track progress.' },
  { prefix: '/applicant/accept-policy', title: 'Accept policy', description: 'Review and accept the student portal terms.' },
];

export default function StudentPortalTopBar({ onToggleSidebar }) {
  const pathname = usePathname() || '';
  const meta = PAGE_META.find((p) => pathname.startsWith(p.prefix)) || {
    title: 'Student portal',
    description: 'Welcome to your application workspace.',
  };

  return (
    <header className="flex items-center justify-between bg-white px-4 sm:px-6 lg:px-8 gap-4 py-4 border-b border-neutral-200">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Image
          src="/images/applyUniNow.png"
          alt="ONECRM Logo"
          width={58}
          height={58}
          className="h-12 w-15 shrink-0 object-contain hidden sm:block"
        />

        <div className="min-w-0 hidden md:flex flex-col">
          <p className="text-lg font-bold leading-tight text-slate-900">{meta.title}</p>
          <p className="text-xs text-slate-500 truncate">{meta.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <NotificationBell />
      </div>
    </header>
  );
}
