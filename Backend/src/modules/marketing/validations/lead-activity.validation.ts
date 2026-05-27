import { z } from 'zod';

export const createLeadActivitySchema = z.object({
    activityType: z.enum([
        'NOTE',
        'CALL',
        'EMAIL',
        'SMS',
        'WHATSAPP',
        'MEETING',
    ]),

    comment: z.string().optional(),

    metadata: z.any().optional(),
});