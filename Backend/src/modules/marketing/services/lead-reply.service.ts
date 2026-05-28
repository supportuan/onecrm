import { prisma } from '../../../prisma.js';
import { ActivityType } from '@prisma/client';

type ReplyChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'STUDENT_CRM';

const normalizePhone = (value?: string) => {
    if (!value) return '';
    return value.replace(/\D/g, '');
};

const mapChannelToActivityType = (channel: ReplyChannel): ActivityType => {
    if (channel === 'EMAIL') return ActivityType.EMAIL;
    if (channel === 'SMS') return ActivityType.SMS;
    if (channel === 'WHATSAPP') return ActivityType.WHATSAPP;
    return ActivityType.NOTE;
};

export const saveInboundReply = async ({
    channel,
    from,
    message,
    leadId,
    fromUserId,
    providerPayload,
}: {
    channel: ReplyChannel;
    from?: string;
    message: string;
    leadId?: number;
    fromUserId?: number;
    providerPayload?: any;
}) => {
    if (!message?.trim()) {
        throw new Error('Reply message is required');
    }

    let lead = null;

    if (leadId) {
        lead = await prisma.lead.findFirst({
            where: {
                id: leadId,
                deletedAt: null,
            },
        });
    }

    if (!lead && from) {
        const normalizedFrom = normalizePhone(from);

        lead = await prisma.lead.findFirst({
            where: {
                deletedAt: null,
                OR: [
                    { email: from },
                    { phone: from },
                    { phone: { contains: normalizedFrom } },
                ],
            },
        });
    }

    if (!lead) {
        throw new Error('No matching lead found for inbound reply');
    }

    return prisma.leadActivity.create({
        data: {
            leadId: lead.id,
            activityType: mapChannelToActivityType(channel),
            comment: message,
            metadata: {
                direction: 'INBOUND',
                channel,
                fromLead: true,
                from,
                fromUserId,
                providerPayload: providerPayload || null,
            },
        },
    });
};