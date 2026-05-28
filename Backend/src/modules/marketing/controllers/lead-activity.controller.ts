import { Request, Response, NextFunction } from 'express';

import * as leadActivityService from '../services/lead-activity.service.js';
import { createLeadActivitySchema } from '../validations/lead-activity.validation.js';

export const getLeadActivities = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const leadId = Number(req.params.id);

        if (isNaN(leadId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid lead ID',
            });
        }

        const activities = await leadActivityService.getLeadActivities(leadId);

        return res.status(200).json({
            success: true,
            message: 'Lead activities fetched successfully',
            data: activities,
        });
    } catch (error) {
        next(error);
    }
};

export const createLeadActivity = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const leadId = Number(req.params.id);

        if (isNaN(leadId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid lead ID',
            });
        }

        const validatedData = createLeadActivitySchema.parse(req.body);

        const activity = await leadActivityService.createLeadActivity(leadId, {
            ...validatedData,
            actorId: (req as any).user?.id || null,
        });

        return res.status(201).json({
            success: true,
            message: 'Activity created successfully',
            data: activity,
        });
    } catch (error) {
        next(error);
    }
};