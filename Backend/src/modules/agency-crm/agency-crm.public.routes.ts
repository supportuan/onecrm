import { Router } from 'express';
import * as controller from './agency-crm.public.controller.js';

const router = Router();

router.get('/referral/:code', controller.resolveReferralCode);

export default router;
