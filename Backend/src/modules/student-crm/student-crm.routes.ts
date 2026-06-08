import { Router } from 'express';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from '../rbac/rbac.middleware.js';
import * as controller from './student-crm.controller.js';

const router = Router();

router.use(authenticateToken);

// All read endpoints — VIEW_STUDENT_CRM (or MANAGE_STUDENT_CRM which is a stronger permission).
const view = requirePermission('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM');
const manage = requirePermission('MANAGE_STUDENT_CRM');

// Students
router.get('/students', view, controller.listStudents);
router.get('/students/:id', view, controller.getStudent);
router.post('/students', manage, controller.createStudent);
router.put('/students/:id', manage, controller.updateStudent);

// Applications — list/get
router.get('/applications', view, controller.listApplications);
router.get('/applications/:id', view, controller.getApplication);

// Applications — write
router.post('/applications', manage, controller.createApplication);
router.put('/applications/:id', manage, controller.updateApplication);
router.post('/applications/:id/advance', manage, controller.advanceStage);

// Application documents
router.post('/applications/:id/documents', manage, controller.upsertDocument);
router.put('/applications/:id/documents/:docId', manage, controller.upsertDocument);
router.delete('/applications/:id/documents/:docId', manage, controller.deleteDocument);
router.post('/applications/:id/notify-missing-docs', manage, controller.notifyMissing);

// Offer / visa
router.put('/applications/:id/offer', manage, controller.upsertOffer);
router.put('/applications/:id/visa', manage, controller.upsertVisa);

// Checklist defaults (used by UI before docs exist)
router.get('/checklist', view, controller.getChecklist);

// Lead → Application bridge (Phase 2)
router.post('/applications/from-lead/:leadId', manage, controller.createFromLead);

export default router;
