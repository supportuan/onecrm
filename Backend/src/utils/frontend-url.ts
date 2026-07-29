import type { Request } from 'express';

/** Production CRM origin — used when FRONTEND_URL is unset in prod. */
export const DEFAULT_FRONTEND_URL = 'https://crm.applyuninow.com';

export const getFrontendBaseUrl = (req?: Pick<Request, 'headers'>): string => {
  const fromEnv = (process.env.FRONTEND_URL || '').trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  const origin = typeof req?.headers?.origin === 'string' ? req.headers.origin.trim() : '';
  if (origin && /^https?:\/\//i.test(origin) && !/localhost|127\.0\.0\.1/i.test(origin)) {
    return origin.replace(/\/$/, '');
  }

  const referer = typeof req?.headers?.referer === 'string' ? req.headers.referer.trim() : '';
  if (referer) {
    try {
      const u = new URL(referer);
      if ((u.protocol === 'http:' || u.protocol === 'https:') && !/localhost|127\.0\.0\.1/i.test(u.hostname)) {
        return `${u.protocol}//${u.host}`;
      }
    } catch {
      /* ignore bad referer */
    }
  }

  if (process.env.NODE_ENV === 'production') return DEFAULT_FRONTEND_URL;
  return 'http://localhost:3000';
};

export const getLoginUrl = (req?: Pick<Request, 'headers'>) =>
  `${getFrontendBaseUrl(req)}/login`;

export const getDashboardUrl = (req?: Pick<Request, 'headers'>) =>
  `${getFrontendBaseUrl(req)}/`;
