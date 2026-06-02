import express from 'express';

import {
    receiveEmailReply,
    receiveSMSReply,
    receiveWhatsAppReply,
    receiveStudentCRMReply,
} from '../controllers/lead-reply.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/marketing/replies/email:
 *   post:
 *     summary: Receive inbound email reply and save to lead history
 *     tags: [Lead Replies]
 */
router.post('/replies/email', receiveEmailReply);

/**
 * @swagger
 * /api/marketing/replies/sms:
 *   post:
 *     summary: Receive inbound SMS reply and save to lead history
 *     tags: [Lead Replies]
 */
router.post('/replies/sms', receiveSMSReply);

/**
 * @swagger
 * /api/marketing/replies/whatsapp:
 *   post:
 *     summary: Receive inbound WhatsApp reply and save to lead history
 *     tags: [Lead Replies]
 */
router.post('/replies/whatsapp', receiveWhatsAppReply);

/**
 * @swagger
 * /api/marketing/replies/student-crm:
 *   post:
 *     summary: Receive inbound Student CRM reply and save to lead history
 *     tags: [Lead Replies]
 */
router.post('/replies/student-crm', receiveStudentCRMReply);

export default router;