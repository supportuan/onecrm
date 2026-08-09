'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PanelLeftClose } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export const BRAND_NAME = 'OneCRM';
export const BRAND_TAGLINE = 'Intelligence Connecting Seamlessly!';
export const BRAND_LOGO_SRC = '/images/applyUniNow.png';

/** Local static marks use next/image; tenant/upload URLs use <img>. */
function BrandMark({
  src,
  alt = '',
  className = '',
  width = 24,
  height = 24,
  priority = false,
}) {
  const resolved = src || BRAND_LOGO_SRC;
  const isLocalStatic = resolved.startsWith('/images/');

  if (isLocalStatic) {
    return (
      <Image
        src={resolved}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={`shrink-0 object-contain ${className}`}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      width={width}
      height={height}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

export function useTenantBrand() {
  const { user } = useAuth();
  return {
    logoSrc: user?.tenantLogoUrl || BRAND_LOGO_SRC,
    name: user?.tenantName || BRAND_NAME,
    tagline: BRAND_TAGLINE,
    hasCustomLogo: Boolean(user?.tenantLogoUrl),
  };
}

export function AppLogo({ className = 'h-10 w-10', priority = false }) {
  const { logoSrc, name } = useTenantBrand();
  return (
    <BrandMark
      src={logoSrc}
      alt={name}
      width={56}
      height={56}
      priority={priority}
      className={className}
    />
  );
}

export function AppBrand({
  subtitle = BRAND_TAGLINE,
  title,
  compact = false,
  href = null,
  logoClassName,
  titleClassName = 'text-lg font-bold tracking-tight text-brand truncate',
  subtitleClassName = 'text-[11px] text-brand-muted truncate leading-snug',
}) {
  const brand = useTenantBrand();
  const resolvedTitle = title ?? brand.name;

  const inner = (
    <>
      <BrandMark
        src={brand.logoSrc}
        alt={resolvedTitle}
        width={36}
        height={36}
        className={logoClassName || (compact ? 'h-8 w-8' : 'h-9 w-9')}
      />
      {!compact && (
        <div className="min-w-0 overflow-hidden">
          <p className={titleClassName}>{resolvedTitle}</p>
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
  const brand = useTenantBrand();

  const logoAndTitle = (
    <>
      <BrandMark
        src={brand.logoSrc}
        alt=""
        width={24}
        height={24}
        priority
        className="h-[22px] w-[22px]"
      />
      <p className="app-title-gradient truncate text-[17px] font-bold leading-none tracking-tight">
        {brand.name}
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
          <BrandMark
            src={brand.logoSrc}
            alt={brand.name}
            width={24}
            height={24}
            className="h-[22px] w-[22px]"
          />
        </button>
      )}
    </div>
  );
}
