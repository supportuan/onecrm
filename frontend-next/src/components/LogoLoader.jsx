'use client';

import Image from 'next/image';
import { BRAND_LOGO_SRC } from '@/components/AppBrand';

/**
 * Branded lazy-load indicator using the ONECRM logo mark.
 * - fullscreen: covers the viewport (auth / route transitions)
 * - inline/compact: for section/table loading states
 */
export default function LogoLoader({
  fullscreen = false,
  label = 'Loading…',
  size = 'md',
  className = '',
}) {
  const dims = {
    sm: { box: 'h-10 w-10', img: 28, ring: 'h-12 w-12' },
    md: { box: 'h-14 w-14', img: 40, ring: 'h-16 w-16' },
    lg: { box: 'h-20 w-20', img: 56, ring: 'h-24 w-24' },
  }[size] || { box: 'h-14 w-14', img: 40, ring: 'h-16 w-16' };

  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={`logo-loader relative ${dims.ring}`}>
        <span className="logo-loader-ring" aria-hidden="true" />
        <div
          className={`logo-loader-mark absolute inset-0 m-auto flex ${dims.box} items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-brand/10`}
        >
          <Image
            src={BRAND_LOGO_SRC}
            alt=""
            width={dims.img}
            height={dims.img}
            className="object-contain"
            priority
          />
        </div>
      </div>
      {label ? (
        <p className="text-sm font-medium tracking-tight text-brand-muted">{label}</p>
      ) : null}
      <span className="sr-only">{label || 'Loading'}</span>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-page/90 backdrop-blur-[2px]">
        {content}
      </div>
    );
  }

  return content;
}

/** Convenience wrapper for Suspense / route fallbacks */
export function LogoLoaderPage({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center py-16">
      <LogoLoader label={label} size="md" />
    </div>
  );
}
