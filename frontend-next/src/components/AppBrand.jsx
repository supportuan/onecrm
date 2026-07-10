'use client';

import Image from 'next/image';
import Link from 'next/link';

export function AppLogo({ className = 'h-9 w-9', priority = false }) {
  return (
    <Image
      src="/images/applyUniNow.png"
      alt="ONECRM"
      width={48}
      height={48}
      priority={priority}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

export function AppBrand({
  subtitle = 'Role based access',
  title = 'ONECRM',
  compact = false,
  href = null,
}) {
  const inner = (
    <>
      <AppLogo className={compact ? 'h-8 w-8' : 'h-9 w-9'} />
      {!compact && (
        <div className="min-w-0 overflow-hidden">
          <p className="text-sm font-bold tracking-tight text-neutral-900 truncate">{title}</p>
          {subtitle && (
            <p className="text-[10px] text-neutral-400 truncate leading-snug">{subtitle}</p>
          )}
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
