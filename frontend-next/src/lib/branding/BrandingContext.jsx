'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  applyInstallLoginTheme,
} from '@/lib/stores/appearanceStore';
import { ALLIED_HEADING_DEFAULT, DEFAULT_ALLIED_SERVICES } from '@/lib/allied-services';

export const BRAND_NAME = 'OneCRM';
export const BRAND_TAGLINE = 'Intelligence Connecting Seamlessly!';
export const BRAND_LOGO_SRC = '/images/favicon-star-gold.png';
export const AUN_LOGO_SRC = '/images/applyUniNow.png';

export const FALLBACK_BRANDING = {
  name: BRAND_NAME,
  tagline: BRAND_TAGLINE,
  logoUrl: null,
  productName: BRAND_NAME,
  loginHeadline: 'Your journey starts with a quick login',
  loginTheme: 'brand',
  loginThemeLocked: false,
  loginBackgroundUrl: null,
  showAlliedServices: false,
  showSampleModules: false,
  alliedHeading: ALLIED_HEADING_DEFAULT,
  alliedServices: DEFAULT_ALLIED_SERVICES.filter((item) => item.enabled),
  privacyCopy: `${BRAND_NAME} uses your information to provide and personalize our services. We protect your data and do not share it with third parties for marketing without your consent. Please review our Privacy and Cookie Policies for more information.`,
  websiteUrl: null,
  tenantName: BRAND_NAME,
  tenantLogoUrl: null,
};

const BrandingContext = createContext({
  branding: FALLBACK_BRANDING,
  loading: true,
  refresh: async () => {},
});

function normalizeBranding(raw) {
  if (!raw || typeof raw !== 'object') return FALLBACK_BRANDING;
  const name = raw.name || raw.tenantName || FALLBACK_BRANDING.name;
  const logoUrl = raw.logoUrl || raw.tenantLogoUrl || null;
  const alliedServices = Array.isArray(raw.alliedServices)
    ? raw.alliedServices
    : FALLBACK_BRANDING.alliedServices;
  return {
    ...FALLBACK_BRANDING,
    ...raw,
    name,
    logoUrl,
    tenantName: raw.tenantName || name,
    tenantLogoUrl: raw.tenantLogoUrl || logoUrl,
    loginBackgroundUrl: raw.loginBackgroundUrl || null,
    alliedHeading: raw.alliedHeading || FALLBACK_BRANDING.alliedHeading,
    alliedServices,
  };
}

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(FALLBACK_BRANDING);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/org/branding', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      const next = normalizeBranding(json?.data);
      setBranding(next);
      applyInstallLoginTheme(next.loginTheme, { locked: next.loginThemeLocked });
      if (typeof document !== 'undefined' && next.name) {
        document.title = next.name;
      }
    } catch {
      /* keep fallbacks — login still works */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const value = useMemo(() => ({ branding, loading, refresh }), [branding, loading, refresh]);
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useOrgBranding() {
  return useContext(BrandingContext);
}

export function resolveBrandLogo(name, logoUrl) {
  if (logoUrl) return logoUrl;
  if (name === 'ApplyUniNow') return AUN_LOGO_SRC;
  return BRAND_LOGO_SRC;
}
