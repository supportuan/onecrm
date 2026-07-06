

// import { Router } from 'express';
// import {
//     getPages,
//     getForms,
//     syncLeads,
//     verifyWebhook,
//     receiveWebhook,
// } from '../controllers/meta.controller.js';

// const router = Router();

// /**
//  * @swagger
//  * tags:
//  *   name: Meta
//  *   description: Meta Facebook/Instagram Lead Ads integration APIs
//  */

// /**
//  * @swagger
//  * /api/marketing/meta/pages:
//  *   get:
//  *     summary: Get Meta pages connected to the access token
//  *     tags: [Meta]
//  *     responses:
//  *       200:
//  *         description: Successfully fetched Meta pages
//  */
// router.get('/pages', getPages);

// /**
//  * @swagger
//  * /api/marketing/meta/pages/{pageId}/forms:
//  *   get:
//  *     summary: Get Meta lead forms for a page
//  *     tags: [Meta]
//  *     parameters:
//  *       - in: path
//  *         name: pageId
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Successfully fetched Meta lead forms
//  */
// router.get('/pages/:pageId/forms', getForms);

// /**
//  * @swagger
//  * /api/marketing/meta/sync:
//  *   post:
//  *     summary: Sync recent Meta leads into CRM
//  *     tags: [Meta]
//  *     responses:
//  *       200:
//  *         description: Meta leads synced successfully
//  */
// router.post('/sync', syncLeads);

// /**
//  * @swagger
//  * /api/marketing/meta/webhook:
//  *   get:
//  *     summary: Verify Meta webhook
//  *     tags: [Meta]
//  *     parameters:
//  *       - in: query
//  *         name: hub.mode
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: hub.verify_token
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: hub.challenge
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Webhook verified
//  *       403:
//  *         description: Invalid verify token
//  */
// router.get('/webhook', verifyWebhook);

// /**
//  * @swagger
//  * /api/marketing/meta/webhook:
//  *   post:
//  *     summary: Receive Meta leadgen webhook events
//  *     tags: [Meta]
//  *     responses:
//  *       200:
//  *         description: Webhook received successfully
//  */
// router.post('/webhook', receiveWebhook);

// export default router;


import { Router } from 'express';
import {
    getPages,
    getForms,
    getFormLeads,
    syncLeads,
    syncAllLeads,
    verifyWebhook,
    receiveWebhook,
} from '../controllers/meta.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Meta
 *   description: Meta Facebook/Instagram Lead Ads Integration APIs
 */

/**
 * @swagger
 * /api/marketing/meta/pages:
 *   get:
 *     summary: Get connected Meta Page
 *     description: Returns the Meta Facebook Page associated with the configured access token.
 *     tags: [Meta]
 *     responses:
 *       200:
 *         description: Meta page fetched successfully.
 *       500:
 *         description: Failed to fetch page.
 */
router.get('/pages', getPages);

/**
 * @swagger
 * /api/marketing/meta/pages/{pageId}/forms:
 *   get:
 *     summary: Get Meta Lead Forms
 *     description: Returns all Lead Forms available for the selected Facebook Page.
 *     tags: [Meta]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Facebook Page ID
 *     responses:
 *       200:
 *         description: Meta Lead Forms fetched successfully.
 *       500:
 *         description: Failed to fetch lead forms.
 */
router.get('/pages/:pageId/forms', getForms);

/**
 * @swagger
 * /api/marketing/meta/forms/{formId}/leads:
 *   get:
 *     summary: Get Historical Leads
 *     description: Returns all leads submitted through a specific Meta Lead Form.
 *     tags: [Meta]
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meta Lead Form ID
 *     responses:
 *       200:
 *         description: Historical leads fetched successfully.
 *       500:
 *         description: Failed to fetch form leads.
 */
router.get('/forms/:formId/leads', getFormLeads);

/**
 * @swagger
 * /api/marketing/meta/sync:
 *   post:
 *     summary: Sync Recent Meta Leads
 *     description: Syncs only recently submitted Meta Lead Ads into the CRM.
 *     tags: [Meta]
 *     responses:
 *       200:
 *         description: Recent Meta leads synced successfully.
 *       500:
 *         description: Sync failed.
 */
router.post('/sync', syncLeads);

/**
 * @swagger
 * /api/marketing/meta/sync-all:
 *   post:
 *     summary: Sync All Historical Meta Leads
 *     description: Imports every historical Meta Lead from all Lead Forms into the CRM.
 *     tags: [Meta]
 *     responses:
 *       200:
 *         description: Historical Meta leads synced successfully.
 *       500:
 *         description: Sync failed.
 */
router.post('/sync-all', syncAllLeads);

/**
 * @swagger
 * /api/marketing/meta/webhook:
 *   get:
 *     summary: Verify Meta Webhook
 *     description: Meta uses this endpoint during webhook verification.
 *     tags: [Meta]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         required: true
 *         schema:
 *           type: string
 *         example: subscribe
 *       - in: query
 *         name: hub.verify_token
 *         required: true
 *         schema:
 *           type: string
 *         example: applyuninow_meta_webhook_2026
 *       - in: query
 *         name: hub.challenge
 *         required: true
 *         schema:
 *           type: string
 *         example: "123456"
 *     responses:
 *       200:
 *         description: Webhook verified successfully.
 *       403:
 *         description: Invalid verify token.
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