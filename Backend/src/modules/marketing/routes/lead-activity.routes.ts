import express from 'express';

import {
    getLeadActivities,
    createLeadActivity,
} from '../controllers/lead-activity.controller';

const router = express.Router();

router.get(
    '/leads/:id/activities',
    getLeadActivities
);

router.post(
    '/leads/:id/activities',
    createLeadActivity
);

export default router;