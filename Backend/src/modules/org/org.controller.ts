import { Request, Response, NextFunction } from 'express';
import { sendError, sendSuccess } from '../../utils/response.js';
import {
  clearLoginBackground,
  clearLogo,
  getAdminAppearance,
  getPublicAppearance,
  resolveLoginBackgroundFile,
  resolveLogoFile,
  saveLoginBackground,
  saveLogo,
  updateAppearance,
} from './org.service.js';

export const getPublicBranding = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const branding = await getPublicAppearance();
    return sendSuccess(res, 'Branding retrieved', branding);
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getAdminAppearance();
    return sendSuccess(res, 'Appearance settings retrieved', settings);
  } catch (error) {
    next(error);
  }
};

export const putSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await updateAppearance((req.body || {}) as Record<string, unknown>);
    return sendSuccess(res, 'Appearance settings saved', settings);
  } catch (error) {
    next(error);
  }
};

export const uploadLoginBackground = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file?.buffer?.length) {
      return sendError(res, 'MP4 file is required', null, 400);
    }
    const settings = await saveLoginBackground({
      buffer: file.buffer,
      originalname: file.originalname || 'login-background.mp4',
      mimetype: file.mimetype || 'video/mp4',
    });
    return sendSuccess(res, 'Login background uploaded', settings);
  } catch (error) {
    next(error);
  }
};

export const deleteLoginBackground = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await clearLoginBackground();
    return sendSuccess(res, 'Login background removed', settings);
  } catch (error) {
    next(error);
  }
};

export const streamLoginBackground = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const resolved = await resolveLoginBackgroundFile();
    if (!resolved) {
      return sendError(res, 'No login background uploaded', null, 404);
    }
    if (resolved.kind === 'redirect') {
      if (!resolved.url) return sendError(res, 'No login background uploaded', null, 404);
      return res.redirect(302, resolved.url);
    }
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.sendFile(resolved.path);
  } catch (error) {
    next(error);
  }
};

export const uploadLogo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file?.buffer?.length) {
      return sendError(res, 'Logo image is required', null, 400);
    }
    const settings = await saveLogo({
      buffer: file.buffer,
      originalname: file.originalname || 'logo.png',
      mimetype: file.mimetype || 'image/png',
    });
    return sendSuccess(res, 'Logo uploaded', settings);
  } catch (error) {
    next(error);
  }
};

export const deleteLogo = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await clearLogo();
    return sendSuccess(res, 'Logo removed', settings);
  } catch (error) {
    next(error);
  }
};

const logoContentType = (filePath: string) => {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/png';
};

export const streamLogo = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const resolved = await resolveLogoFile();
    if (!resolved) {
      return sendError(res, 'No custom logo uploaded', null, 404);
    }
    if (resolved.kind === 'redirect') {
      if (!resolved.url) return sendError(res, 'No custom logo uploaded', null, 404);
      return res.redirect(302, resolved.url);
    }
    res.setHeader('Content-Type', logoContentType(resolved.path));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.sendFile(resolved.path);
  } catch (error) {
    next(error);
  }
};
