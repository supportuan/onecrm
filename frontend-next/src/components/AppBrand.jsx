'use client';

import Image from 'next/image';
import Link from 'next/link';

export const BRAND_NAME = 'OneCRM';
export const BRAND_TAGLINE = 'Intelligence Connecting Seamlessly!';
export const BRAND_LOGO_SRC = '/images/applyUniNow.png';

export function AppLogo({ className = 'h-10 w-10', priority = false }) {
  return (
    <Image
      src={BRAND_LOGO_SRC}
      alt={BRAND_NAME}
      width={56}
      height={56}
      priority={priority}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

export function AppBrand({
  subtitle = BRAND_TAGLINE,
  title = BRAND_NAME,
  compact = false,
  href = null,
  logoClassName,
  titleClassName = 'text-lg font-bold tracking-tight text-brand truncate',
  subtitleClassName = 'text-[11px] text-brand-muted truncate leading-snug',
}) {
  const inner = (
    <>
      <AppLogo className={logoClassName || (compact ? 'h-8 w-8' : 'h-9 w-9')} />
      {!compact && (
        <div className="min-w-0 overflow-hidden">
          <p className={titleClassName}>{title}</p>
          {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
        </div>
      )}
    </>
  );

  const cls = `flex items-center gap-2.5 min-w-0 ${compact ? 'justify-center' : ''}`;

  if (href && !compact) {
    return (
      <Link href={href} className={`${cls} hover:opacity-90 transition`}>
        {inner}
      </Link>
    );
  }

  return <div className={cls}>{inner}</div>;
}
