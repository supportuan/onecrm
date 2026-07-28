'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PanelLeftClose } from 'lucide-react';

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

/**
 * Staff + student sidebar brand strip — compact logo, title, and tagline.
 */
export function SidebarBrandHeader({
  sidebarOpen,
  onToggleSidebar,
  subtitle = BRAND_TAGLINE,
  homeHref = null,
}) {
  const logoAndTitle = (
    <>
      <Image
        src={BRAND_LOGO_SRC}
        alt=""
        width={24}
        height={24}
        priority
        className="h-[22px] w-[22px] shrink-0 object-contain"
      />
      <p className="app-title-gradient truncate text-[17px] font-bold leading-none tracking-tight">
        {BRAND_NAME}
      </p>
    </>
  );

  return (
    <div
      className={`app-shell-sidebar-header flex flex-none flex-col justify-center border-b border-neutral-100/80 ${
        sidebarOpen ? 'gap-0.5 px-3' : 'items-center justify-center px-2'
      }`}
    >
      {sidebarOpen ? (
        <>
          <div className="flex items-center justify-between gap-2">
            {homeHref ? (
              <Link
                href={homeHref}
                className="flex min-w-0 flex-1 items-center gap-2 hover:opacity-90"
              >
                {logoAndTitle}
              </Link>
            ) : (
              <div className="flex min-w-0 flex-1 items-center gap-2">{logoAndTitle}</div>
            )}
            <button
              type="button"
              onClick={onToggleSidebar}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
          {subtitle ? (
            <p className="truncate text-[10px] font-medium leading-none text-neutral-400">
              {subtitle}
            </p>
          ) : null}
        </>
      ) : (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-neutral-100"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <Image
            src={BRAND_LOGO_SRC}
            alt={BRAND_NAME}
            width={24}
            height={24}
            className="h-[22px] w-[22px] object-contain"
          />
        </button>
      )}
    </div>
  );
}
