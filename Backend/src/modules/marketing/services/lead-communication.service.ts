import { prisma } from '../../../prisma.js';
import { ActivityType } from '@prisma/client';
import { sendCampaignEmail } from './email.service.js';
import { sendSMS } from './sms.service.js';
import { sendWhatsAppMessage } from './whatsapp.service.js';

const getLeadById = async (leadId: number) => {
    const lead = await prisma.lead.findFirst({
        where: {
            id: leadId,
            deletedAt: null,
        },
        include: {
            source: true,
        },
    });

    if (!lead) {
        throw new Error('Lead not found');
    }

    return lead;
};

const replaceLeadVariables = (template: string, lead: any) => {
    return template
        .replaceAll('{{fullName}}', lead.fullName || '')
        .replaceAll('{{email}}', lead.email || '')
        .replaceAll('{{phone}}', lead.phone || '')
        .replaceAll('{{country}}', lead.country || 'your country')
        .replaceAll('{{preferredCourse}}', lead.preferredCourse || 'your selected course')
        .replaceAll('{{preferredCountry}}', lead.preferredCountry || 'your preferred country')
        .replaceAll('{{source}}', lead.source?.name || 'CRM');
};

export const sendLeadEmail = async (
    leadId: number,
    body: {
        subject?: string;
        message?: string;
    }
) => {
    const lead = await getLeadById(leadId);

    if (!lead.email) {
        throw new Error('Lead email is missing');
    }

    const subject = body.subject || `Study Abroad Consultation - ${lead.fullName}`;

    const template =
        body.message ||
        `Hi {{fullName}},

Thank you for your interest in {{preferredCourse}} in {{preferredCountry}}.

Our counsellor will contact you shortly and guide you with the next steps.

Regards,
One Workspace`;

    const message = replaceLeadVariables(template, lead);

    const result = await sendCampaignEmail({
        to: lead.email,
        subject,
        html: message.replace(/\n/g, '<br/>'),
    });

    await prisma.leadActivity.create({
        data: {
            leadId,
            activityType: ActivityType.EMAIL,
            comment: message,
            metadata: {
                subject,
                provider: 'SMTP',
                result: result as any,
            },
        },
    });

    return {
        leadId,
        to: lead.email,
        subject,
        message,
        result,
    };
};

export const sendLeadSMS = async (
    leadId: number,
    body: {
        message?: string;
    }
) => {
    const lead = await getLeadById(leadId);

    if (!lead.phone) {
        throw new Error('Lead phone number is missing');
    }

    const template =
        body.message ||
        `Hi {{fullName}}, thank you for your interest in {{preferredCourse}}. Our counsellor will contact you shortly. - One Workspace`;

    const message = replaceLeadVariables(template, lead);

    const result = await sendSMS({
        to: lead.phone,
        message,
    });

    await prisma.leadActivity.create({
        data: {
            leadId,
            activityType: ActivityType.SMS,
            comment: message,
            metadata: {
                provider: 'Twilio',
                result,
            },
        },
    });

    return {
        leadId,
        to: lead.phone,
        message,
        result,
    };
};

export const sendLeadWhatsApp = async (
    leadId: number,
    body: {
        message?: string;
    }
) => {
    const lead = await getLeadById(leadId);

    if (!lead.phone) {
        throw new Error('Lead phone number is missing');
    }

    const template =
        body.message ||
        `Hi {{fullName}}, thanks for showing interest in {{preferredCourse}} in {{preferredCountry}}. Reply YES to connect with our counsellor.`;

    const message = replaceLeadVariables(template, lead);

    const result = await sendWhatsAppMessage({
        phone: lead.phone,
        message,
    });

    await prisma.leadActivity.create({
        data: {
            leadId,
            activityType: ActivityType.WHATSAPP,
            comment: message,
            metadata: {
                provider: 'Meta WhatsApp',
                result: result as any,
            },
        },
    });

    return {
        leadId,
        to: lead.phone,
        message,
        result,
    };
};

export const scheduleLeadMeeting = async (
    leadId: number,
    body: {
        meetingDate?: string;
        meetingLink?: string;
        message?: string;
    }
) => {
    const lead = await getLeadById(leadId);

    const meetingDate = body.meetingDate || new Date().toISOString();
    const meetingLink = body.meetingLink || 'Meeting link will be shared soon';

    const template =
        body.message ||
        `Hi {{fullName}}, your counselling meeting is scheduled on ${meetingDate}. Meeting link: ${meetingLink}`;

    const message = replaceLeadVariables(template, lead);

    await prisma.leadActivity.create({
        data: {
            leadId,
            activityType: ActivityType.MEETING,
            comment: message,
            metadata: {
                meetingDate,
                meetingLink,
            },
        },
    });

    return {
        leadId,
        meetingDate,
        meetingLink,
        message,
    };
};