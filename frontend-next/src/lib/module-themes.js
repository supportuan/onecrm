/** Crimson accent used by the newer placeholder / ops modules. */
export const MODULE_CRIMSON = '#C22032';
export const MODULE_CRIMSON_HOVER = '#A41B2A';
export const MODULE_CRIMSON_SOFT = '#FCE8EB';

/** Path prefixes that use the crimson module theme (#C22032). */
export const CRIMSON_MODULE_PATHS = [
  '/operations',
  '/finance',
  '/inventory-management',
  '/project-management',
  '/chatbot-events',
  '/blogs-news',
  '/ai-insights',
  '/archive',
];

export function isCrimsonModulePath(pathname = '') {
  return CRIMSON_MODULE_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
