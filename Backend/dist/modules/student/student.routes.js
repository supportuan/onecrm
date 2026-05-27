import { Router } from 'express';
// @ts-ignore JavaScript middleware has no d.ts
import { authenticateToken } from '../../middleware/auth.js';
import * as controller from './student.controller.js';
const router = Router();
router.use(authenticateToken);
router.get('/students', controller.getStudents);
router.get('/profile', controller.getMyStudentProfile);
router.get('/dashboard', controller.getMyStudentDashboard);
export default router;
