'use client';

import { AppBrand, AppLogo } from '@/components/AppBrand';

export function StudentPortalLogo({ className = 'h-9 w-9', priority = false }) {
  return <AppLogo className={className} priority={priority} />;
}

export function StudentPortalBrand({ compact = false, asLink = true }) {
  return (
    <AppBrand
      compact={compact}
      subtitle="Student portal"
      href={asLink && !compact ? '/applicant/applications' : null}
    />
  );
}
