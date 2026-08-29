import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from '../rbac/rbac.middleware.js';
import { sendError } from '../../utils/response.js';
import {
  deleteLoginBackground,
  deleteLogo,
  getPublicBranding,
  getSettings,
  putSettings,
  streamLoginBackground,
  streamLogo,
  uploadLoginBackground,
  uploadLogo,
} from './org.controller.js';

const router = Router();

const uploadLoginVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isMp4 = file.mimetype === 'video/mp4' || /\.mp4$/i.test(file.originalname || '');
    if (!isMp4) {
      cb(new Error('Only MP4 video files are allowed'));
      return;
    }
    cb(null, true);
  },
});

const uploadLogoImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const looksLikeImage = allowed.includes(file.mimetype) || /\.(jpe?g|png|webp|gif)$/i.test(file.originalname || '');
    if (!looksLikeImage) {
      cb(new Error('Only JPG, PNG, WEBP, or GIF logos are allowed'));
      return;
    }
    cb(null, true);
  },
});

const viewSettings = requirePermission('VIEW_ADMIN', 'MANAGE_SYSTEM', 'MANAGE_ADMINS');
const manageSettings = requirePermission('MANAGE_SYSTEM', 'MANAGE_ADMINS');

/**
 * @swagger
 * /api/org/branding:
 *   get:
 *     summary: Public install branding (login page, no auth)
 *     tags: [Org]
 *     security: []
 *     responses:
 *       200:
 *         description: Name, logo, tagline, login theme, allied services, and login video for this install
 */
router.get('/branding', getPublicBranding);
router.get('/login-background', streamLoginBackground);
router.get('/logo', streamLogo);

router.get('/settings', authenticateToken, viewSettings, getSettings);
router.put('/settings', authenticateToken, manageSettings, putSettings);
router.post(
  '/settings/login-background',
  authenticateToken,
  manageSettings,
  (req, res, next) => {
    uploadLoginVideo.single('file')(req, res, (err) => {
      if (!err) return next();
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Video must be 80MB or smaller'
          : err.message || 'Upload failed';
      return sendError(res, message, null, 400);
    });
  },
  uploadLoginBackground,
);
router.delete('/settings/login-background', authenticateToken, manageSettings, deleteLoginBackground);
router.post(
  '/settings/logo',
  authenticateToken,
  manageSettings,
  (req, res, next) => {
    uploadLogoImage.single('file')(req, res, (err) => {
      if (!err) return next();
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Logo must be 8MB or smaller'
          : err.message || 'Upload failed';
      return sendError(res, message, null, 400);
    });
  },
  uploadLogo,
);
router.delete('/settings/logo', authenticateToken, manageSettings, deleteLogo);

export default router;
