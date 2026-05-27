import { Router } from 'express';
// @ts-ignore JavaScript middleware has no d.ts
import { authenticateToken } from '../../middleware/auth.js';
import * as controller from './agent.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard', controller.getDashboard);
router.get('/profile', controller.getProfile);
router.put('/profile', controller.updateProfile);

router.get('/students', controller.getStudents);
router.get('/students/:studentId', controller.getStudent);
router.get('/students/:studentId/documents', controller.getDocuments);
router.post('/students/:studentId/documents', controller.uploadDocument);

router.get('/university-pocs', controller.getUniversityPocs);
router.post('/university-pocs/:pocId/contact', controller.contactPoc);

router.get('/payments', controller.getPayments);
router.post('/payments', controller.createPayment);

router.get('/agents', controller.listAgents);
router.post('/onboarding', controller.onboardAgent);
router.get('/contract-tiers', controller.getContractTiers);

export default router;
