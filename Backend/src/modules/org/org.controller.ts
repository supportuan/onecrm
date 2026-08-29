import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { resolveOrgBranding } from '../../utils/org-settings.js';

export const getPublicBranding = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const branding = await resolveOrgBranding();
    return sendSuccess(res, 'Branding retrieved', branding);
  } catch (error) {
    next(error);
  }
};
