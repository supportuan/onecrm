import twilio from 'twilio';

export const sendSMS = async ({
    to,
    message,
}: {
    to: string;
    message: string;
}) => {
    if (!process.env.TWILIO_ACCOUNT_SID) {
        throw new Error('TWILIO_ACCOUNT_SID is not configured');
    }

    if (!process.env.TWILIO_AUTH_TOKEN) {
        throw new Error('TWILIO_AUTH_TOKEN is not configured');
    }

    if (!process.env.TWILIO_PHONE) {
        throw new Error('TWILIO_PHONE is not configured');
    }

    const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );

    return client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE,
        to,
    });
};