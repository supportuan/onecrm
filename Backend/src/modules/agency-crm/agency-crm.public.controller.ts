import { Request, Response, NextFunction } from 'express';
import { sendError, sendSuccess } from '../../utils/response.js';
import { capturePublicReferral } from './agency-referral.service.js';

export const resolveReferralCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = String(req.params.code || '').trim();
    if (!code) return sendError(res, 'referral code required', null, 400);
    const partner = await capturePublicReferral(code);
    if (!partner) return sendError(res, 'invalid or inactive referral code', null, 404);
    return sendSuccess(res, 'referral partner', partner);
  } catch (err) {
    next(err);
  }
};
