import { Router } from 'express';
import { getPages, getForms, syncLeads, verifyWebhook, receiveWebhook, } from './meta.controller.js';
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Meta
 *   description: Meta Facebook/Instagram Lead Ads integration APIs
 */
/**
 * @swagger
 * /api/marketing/meta/pages:
 *   get:
 *     summary: Get Meta pages connected to the access token
 *     tags: [Meta]
 *     responses:
 *       200:
 *         description: Successfully fetched Meta pages
 */
router.get('/pages', getPages);
/**
 * @swagger
 * /api/marketing/meta/pages/{pageId}/forms:
 *   get:
 *     summary: Get Meta lead forms for a page
 *     tags: [Meta]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully fetched Meta lead forms
 */
router.get('/pages/:pageId/forms', getForms);
/**
 * @swagger
 * /api/marketing/meta/sync:
 *   post:
 *     summary: Sync recent Meta leads into CRM
 *     tags: [Meta]
 *     responses:
 *       200:
 *         description: Meta leads synced successfully
 */
router.post('/sync', syncLeads);
/**
 * @swagger
 * /api/marketing/meta/webhook:
 *   get:
 *     summary: Verify Meta webhook
 *     tags: [Meta]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.verify_token
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.challenge
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook verified
 *       403:
 *         description: Invalid verify token
 */
router.get('/webhook', verifyWebhook);
/**
 * @swagger
 * /api/marketing/meta/webhook:
 *   post:
 *     summary: Receive Meta leadgen webhook events
 *     tags: [Meta]
 *     responses:
 *       200:
 *         description: Webhook received successfully
 */
router.post('/webhook', receiveWebhook);
export default router;
