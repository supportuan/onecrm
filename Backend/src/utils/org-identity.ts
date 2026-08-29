/** Install identity from env. Same image, different copy per client. */

const LOGIN_THEMES = new Set(['brand', 'aurora', 'mist']);

const envTrim = (key: string) => (process.env[key] || '').trim();

const envFlag = (key: string): boolean | null => {
  const raw = envTrim(key).toLowerCase();
  if (['1', 'true', 'yes'].includes(raw)) return true;
  if (['0', 'false', 'no'].includes(raw)) return false;
  return null;
};

export const DEFAULT_ORG_NAME = 'ApplyUniNow';
export const DEFAULT_PRODUCT_NAME = 'OneCRM';
export const DEFAULT_ORG_TAGLINE = 'Intelligence Connecting Seamlessly!';
export const DEFAULT_LOGIN_HEADLINE = 'Your journey starts with a quick login';
export const DEFAULT_LOGIN_THEME = 'brand';
export const AUN_STATIC_LOGO_PATH = '/images/applyUniNow.png';

export type LoginThemeId = 'brand' | 'aurora' | 'mist';

export const getOrgName = () => envTrim('ORG_NAME') || DEFAULT_ORG_NAME;

export const getProductName = () => envTrim('PRODUCT_NAME') || DEFAULT_PRODUCT_NAME;

export const getOrgTagline = () => envTrim('ORG_TAGLINE') || DEFAULT_ORG_TAGLINE;

export const getLoginHeadline = () => envTrim('LOGIN_HEADLINE') || DEFAULT_LOGIN_HEADLINE;

export const getLoginTheme = (): LoginThemeId => {
  const raw = envTrim('LOGIN_THEME').toLowerCase();
  return LOGIN_THEMES.has(raw) ? (raw as LoginThemeId) : DEFAULT_LOGIN_THEME;
};

export const isLoginThemeLocked = () => envFlag('LOGIN_THEME_LOCKED') === true;

export const getOrgLogoEnvUrl = () => envTrim('ORG_LOGO_URL') || null;

export const getFrontendOrigin = () => envTrim('FRONTEND_URL').replace(/\/$/, '');

/** Absolute logo URL for emails; relative paths are resolved against FRONTEND_URL. */
export const getPublicLogoUrl = () => {
  const raw = getOrgLogoEnvUrl();
  const name = getOrgName();
  const path = raw || (name === DEFAULT_ORG_NAME ? AUN_STATIC_LOGO_PATH : null);
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = getFrontendOrigin();
  if (path.startsWith('/') && base) return `${base}${path}`;
  return path;
};

export const getOrgWebsiteUrl = () =>
  envTrim('ORG_WEBSITE_URL').replace(/\/$/, '') || getFrontendOrigin() || null;

/** Default-on for ApplyUniNow; other ORG_NAME installs must opt in. */
const defaultOnForAun = (flagKey: string) => {
  const flag = envFlag(flagKey);
  if (flag !== null) return flag;
  return !envTrim('ORG_NAME') || getOrgName() === DEFAULT_ORG_NAME;
};

export const showAlliedServices = () => defaultOnForAun('SHOW_ALLIED_SERVICES');

/** Placeholder nav (Operations, Finance, Inventory, …). Hidden on other clients unless opted in. */
export const showSampleModules = () => defaultOnForAun('SHOW_SAMPLE_MODULES');

export const getPrivacyCopy = () => {
  const custom = envTrim('ORG_PRIVACY_COPY');
  if (custom) return custom;
  const name = getOrgName();
  return `${name} uses your information to provide and personalize our services. We protect your data and do not share it with third parties for marketing without your consent. Please review our Privacy and Cookie Policies for more information.`;
};

export const getLogPrefix = () => `[${getOrgName()}]`;
