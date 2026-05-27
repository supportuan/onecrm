import { prisma } from '../../../prisma.js';
import { sendCampaignEmail } from './email.service.js';
import { sendSMS } from './sms.service.js';
import { sendWhatsAppMessage } from './whatsapp.service.js';
export const getLeadActivities = async (leadId) => {
    return prisma.leadActivity.findMany({
        where: {
            leadId,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};
export const createLeadActivity = async (leadId, data) => {
    const lead = await prisma.lead.findFirst({
        where: {
            id: leadId,
            deletedAt: null,
        },
    });
    if (!lead) {
        throw new Error('Lead not found');
    }
    // ==========================================
    // EMAIL
    // ==========================================
    if (data.activityType === 'EMAIL') {
        if (!lead.email) {
            throw new Error('Lead email not found');
        }
        await sendCampaignEmail({
            to: lead.email,
            subject: data.metadata?.subject || 'Lead Follow-up',
            html: `
        <div>
          <h2>Lead Follow-up</h2>
          <p>${data.comment || ''}</p>
        </div>
      `,
        });
    }
    // ==========================================
    // SMS
    // ==========================================
    if (data.activityType === 'SMS') {
        if (!lead.phone) {
            throw new Error('Lead phone number not found');
        }
        await sendSMS({
            to: lead.phone,
            message: data.comment || '',
        });
    }
    // ==========================================
    // WHATSAPP
    // ==========================================
    if (data.activityType === 'WHATSAPP') {
        if (!lead.phone) {
            throw new Error('Lead phone number not found');
        }
        await sendWhatsAppMessage({
            phone: lead.phone,
            templateName: data.metadata?.templateName || 'hello_world',
        });
    }
    // ==========================================
    // SAVE ACTIVITY
    // ==========================================
    const activity = await prisma.leadActivity.create({
        data: {
            leadId,
            actorId: data.actorId || null,
            activityType: data.activityType,
            comment: data.comment || '',
            metadata: data.metadata || {},
        },
    });
    return activity;
};
export const deleteLeadActivity = async (activityId) => {
    return prisma.leadActivity.delete({
        where: {
            id: activityId,
        },
    });
};
export const getLeadActivityById = async (activityId) => {
    return prisma.leadActivity.findUnique({
        where: {
            id: activityId,
        },
    });
};
