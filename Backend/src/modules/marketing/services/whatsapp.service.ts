import axios from 'axios';

const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

const metaConfig = () => {
    if (!process.env.META_ACCESS_TOKEN) {
        throw new Error('META_ACCESS_TOKEN is not configured');
    }
    if (!process.env.META_PHONE_NUMBER_ID) {
        throw new Error('META_PHONE_NUMBER_ID is not configured');
    }
    return {
        token: process.env.META_ACCESS_TOKEN,
        phoneNumberId: process.env.META_PHONE_NUMBER_ID,
    };
};

/** Free-form text message (works inside the 24h customer care window). */
export const sendWhatsAppText = async ({
    phone,
    body,
}: {
    phone: string;
    body: string;
}) => {
    const { token, phoneNumberId } = metaConfig();
    const to = normalizePhone(phone);
    if (!to) throw new Error('invalid phone number');

    return axios.post(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body },
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
};

export const sendWhatsAppMessage = async ({
    phone,
    templateName,
    message,
}: {
    phone: string;
    templateName?: string;
    message?: string;
}) => {
    if (message) {
        return sendWhatsAppText({ phone, body: message });
    }
    if (!templateName) {
        throw new Error('templateName or message is required');
    }

    const { token, phoneNumberId } = metaConfig();
    const to = normalizePhone(phone);
    if (!to) throw new Error('invalid phone number');

    return axios.post(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: 'en',
                },
            },
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
};