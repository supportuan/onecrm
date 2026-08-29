import { Router } from 'express';
import { getPublicBranding } from './org.controller.js';

const router = Router();

/**
 * @swagger
 * /api/org/branding:
 *   get:
 *     summary: Public install branding (login page, no auth)
 *     tags: [Org]
 *     security: []
 *     responses:
 *       200:
 *         description: Name, logo, tagline, and login theme for this install
 */
router.get('/branding', getPublicBranding);

export default router;
