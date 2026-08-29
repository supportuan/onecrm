import { prisma } from '../prisma.js';
import { resolveFileRef } from '../lib/file-storage.js';
import {
  AUN_STATIC_LOGO_PATH,
  DEFAULT_ORG_NAME,
  getLoginHeadline,
  getLoginTheme,
  getOrgName,
  getOrgTagline,
  getOrgWebsiteUrl,
  getPrivacyCopy,
  getProductName,
  getPublicLogoUrl,
  isLoginThemeLocked,
  showAlliedServices,
} from './org-identity.js';

export {
  getLogPrefix,
  getOrgName,
  getOrgTagline,
  getProductName,
  getPublicLogoUrl,
} from './org-identity.js';

export const ensureOrgSettings = async () => {
  return prisma.orgSettings.upsert({
    where: { id: 1 },
    create: { id: 1, name: getOrgName() },
    update: {},
  });
};

export type OrgBranding = {
  name: string;
  tagline: string;
  logoUrl: string | null;
  productName: string;
  loginHeadline: string;
  loginTheme: string;
  loginThemeLocked: boolean;
  showAlliedServices: boolean;
  privacyCopy: string;
  websiteUrl: string | null;
  tenantName: string;
  tenantLogoUrl: string | null;
};

export const resolveOrgBranding = async (): Promise<OrgBranding> => {
  const org = await ensureOrgSettings();
  const name = (org.name || '').trim() || getOrgName();
  const logoFromDb = (await resolveFileRef(org.logoUrl)) || null;
  const logoUrl =
    logoFromDb ||
    getPublicLogoUrl() ||
    (name === DEFAULT_ORG_NAME ? AUN_STATIC_LOGO_PATH : null);

  return {
    name,
    tagline: getOrgTagline(),
    logoUrl,
    productName: getProductName(),
    loginHeadline: getLoginHeadline(),
    loginTheme: getLoginTheme(),
    loginThemeLocked: isLoginThemeLocked(),
    showAlliedServices: showAlliedServices(),
    privacyCopy: getPrivacyCopy(),
    websiteUrl: getOrgWebsiteUrl(),
    tenantName: name,
    tenantLogoUrl: logoUrl,
  };
};
