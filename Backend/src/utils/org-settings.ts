import { prisma } from '../prisma.js';
import { publicAlliedServices, type AlliedServiceItem } from '../modules/org/allied-services.js';
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
  showSampleModules,
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
  loginBackgroundUrl: string | null;
  showAlliedServices: boolean;
  showSampleModules: boolean;
  alliedHeading: string;
  alliedServices: AlliedServiceItem[];
  privacyCopy: string;
  websiteUrl: string | null;
  tenantName: string;
  tenantLogoUrl: string | null;
};

export const resolveOrgBranding = async (): Promise<OrgBranding> => {
  const org = await ensureOrgSettings();
  const name = (org.name || '').trim() || getOrgName();
  const logoUrl = org.logoUrl
    ? `/api/org/logo?v=${org.updatedAt.getTime()}`
    : getPublicLogoUrl() || (name === DEFAULT_ORG_NAME ? AUN_STATIC_LOGO_PATH : null);
  const allied = publicAlliedServices(org.alliedServices);
  const loginBackgroundUrl = org.loginBackgroundUrl
    ? `/api/org/login-background?v=${org.updatedAt.getTime()}`
    : null;

  return {
    name,
    tagline: (org.tagline || '').trim() || getOrgTagline(),
    logoUrl,
    productName: getProductName(),
    loginHeadline: (org.loginHeadline || '').trim() || getLoginHeadline(),
    loginTheme: getLoginTheme(),
    loginThemeLocked: isLoginThemeLocked(),
    loginBackgroundUrl,
    showAlliedServices: showAlliedServices(),
    showSampleModules: showSampleModules(),
    alliedHeading: allied.heading,
    alliedServices: allied.items,
    privacyCopy: getPrivacyCopy(),
    websiteUrl: getOrgWebsiteUrl(),
    tenantName: name,
    tenantLogoUrl: logoUrl,
  };
};
