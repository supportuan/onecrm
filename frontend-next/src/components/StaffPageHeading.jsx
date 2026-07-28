'use client';

import { usePathname } from 'next/navigation';
import { getStaffPageMeta } from '@/lib/staff-page-meta';

export function StaffPageHeading({ title, description, breadcrumb }) {
  if (!title) return null;

  return (
    <header className="mb-4 space-y-0.5">
      {breadcrumb ? (
        <p className="text-[11px] font-semibold leading-none text-slate-400">{breadcrumb}</p>
      ) : null}
      <h1 className="app-title-gradient text-[var(--type-page-title)] font-semibold leading-tight tracking-tight">
        {title}
      </h1>
      {description ? (
        <p className="app-shell-tagline max-w-2xl">
          {description}
        </p>
      ) : null}
    </header>
  );
}

export default function StaffAutoPageHeading() {
  const pathname = usePathname() || '';
  const { title, description, breadcrumb } = getStaffPageMeta(pathname);

  return (
    <StaffPageHeading
      title={title}
      description={description}
      breadcrumb={breadcrumb}
    />
  );
}
