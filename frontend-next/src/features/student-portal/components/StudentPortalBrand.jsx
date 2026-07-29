'use client';

import { AppBrand, AppLogo, BRAND_TAGLINE } from '@/components/AppBrand';

export function StudentPortalLogo({ className = 'h-[22px] w-[22px]', priority = false }) {
  return <AppLogo className={className} priority={priority} />;
}

/** Login / compact marks — same assets as staff shell. */
export function StudentPortalBrand({ compact = false, asLink = true }) {
  return (
    <AppBrand
      compact={compact}
      subtitle={BRAND_TAGLINE}
      logoClassName="h-[22px] w-[22px]"
      titleClassName="app-title-gradient truncate text-[17px] font-bold leading-none tracking-tight"
      subtitleClassName="truncate text-[10px] font-medium leading-none text-neutral-400"
      href={asLink && !compact ? '/applicant/applications' : null}
    />
  );
}
