import axios from 'axios';

export const sendWhatsAppMessage = async ({
    phone,
    templateName,
}: {
    phone: string;
    templateName: string;
}) => {
    if (!process.env.META_ACCESS_TOKEN) {
        throw new Error('META_ACCESS_TOKEN is not configured');
    }

    if (!process.env.META_PHONE_NUMBER_ID) {
        throw new Error('META_PHONE_NUMBER_ID is not configured');
    }

    return axios.post(
        `https://graph.facebook.com/v19.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
        {
            messaging_product: 'whatsapp',
            to: phone,
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
                Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        }
    );
};