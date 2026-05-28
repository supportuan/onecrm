// import express from 'express';

// import {
//     getLeadActivities,
//     createLeadActivity,
// } from '../controllers/lead-activity.controller.js';

// import {
//     sendEmailToLead,
//     sendSMSToLead,
//     sendWhatsAppToLead,
//     scheduleMeetingForLead,
// } from '../controllers/lead-communication.controller.js';

// const router = express.Router();

// router.get(
//     '/leads/:id/activities',
//     getLeadActivities
// );

// router.post(
//     '/leads/:id/activities',
//     createLeadActivity
// );

// /*
// |--------------------------------------------------------------------------
// | Lead Communications
// |--------------------------------------------------------------------------
// */

// router.post(
//     '/leads/:id/send-email',
//     sendEmailToLead
// );

// router.post(
//     '/leads/:id/send-sms',
//     sendSMSToLead
// );

// router.post(
//     '/leads/:id/send-whatsapp',
//     sendWhatsAppToLead
// );

// router.post(
//     '/leads/:id/schedule-meeting',
//     scheduleMeetingForLead
// );

// export default router;

import express from 'express';

import {
    getLeadActivities,
    createLeadActivity,
} from '../controllers/lead-activity.controller.js';

import {
    sendEmailToLead,
    sendSMSToLead,
    sendWhatsAppToLead,
    scheduleMeetingForLead,
} from '../controllers/lead-communication.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/marketing/leads/{id}/activities:
 *   get:
 *     summary: Retrieve history of activities for a lead
 *     tags: [Lead Communication]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Activities retrieved successfully
 */
router.get('/leads/:id/activities', getLeadActivities);

/**
 * @swagger
 * /api/marketing/leads/{id}/activities:
 *   post:
 *     summary: Log new activity for a lead
 *     tags: [Lead Communication]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activityType:
 *                 type: string
 *                 example: EMAIL
 *               comment:
 *                 type: string
 *                 example: Called the lead and explained course details
 *               metadata:
 *                 type: object
 *                 example:
 *                   note: Follow-up required
 *     responses:
 *       200:
 *         description: Activity created successfully
 */
router.post('/leads/:id/activities', createLeadActivity);

/**
 * @swagger
 * /api/marketing/leads/{id}/send-email:
 *   post:
 *     summary: Send email to a lead
 *     tags: [Lead Communication]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lead ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 example: Study Abroad Consultation
 *               message:
 *                 type: string
 *                 example: Hi {{fullName}}, thank you for your interest in {{preferredCourse}}.
 *     responses:
 *       200:
 *         description: Email sent successfully
 */
router.post('/leads/:id/send-email', sendEmailToLead);

/**
 * @swagger
 * /api/marketing/leads/{id}/send-sms:
 *   post:
 *     summary: Send SMS to a lead
 *     tags: [Lead Communication]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lead ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Hi {{fullName}}, thank you for your interest in {{preferredCourse}}.
 *     responses:
 *       200:
 *         description: SMS sent successfully
 */
router.post('/leads/:id/send-sms', sendSMSToLead);

/**
 * @swagger
 * /api/marketing/leads/{id}/send-whatsapp:
 *   post:
 *     summary: Send WhatsApp message to a lead
 *     tags: [Lead Communication]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lead ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Hi {{fullName}}, thanks for showing interest in {{preferredCourse}}.
 *     responses:
 *       200:
 *         description: WhatsApp message sent successfully
 */
router.post('/leads/:id/send-whatsapp', sendWhatsAppToLead);

/**
 * @swagger
 * /api/marketing/leads/{id}/schedule-meeting:
 *   post:
 *     summary: Schedule meeting for a lead
 *     tags: [Lead Communication]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lead ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               meetingDate:
 *                 type: string
 *                 example: 2026-05-25T10:00:00.000Z
 *               meetingLink:
 *                 type: string
 *                 example: https://meet.google.com/abc-defg-hij
 *               message:
 *                 type: string
 *                 example: Hi {{fullName}}, your counselling meeting is scheduled.
 *     responses:
 *       200:
 *         description: Meeting scheduled successfully
 */
router.post('/leads/:id/schedule-meeting', scheduleMeetingForLead);

export default router;