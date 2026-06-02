import nodemailer from 'nodemailer';

export const sendCampaignEmail = async ({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) => {
    console.log('[EMAIL SERVICE] SMTP mode loaded');

    if (!process.env.SMTP_HOST) throw new Error('SMTP_HOST is not configured');
    if (!process.env.SMTP_USER) throw new Error('SMTP_USER is not configured');
    if (!process.env.SMTP_PASS) throw new Error('SMTP_PASS is not configured');
    if (!process.env.EMAIL_FROM) throw new Error('EMAIL_FROM is not configured');

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST.trim(),
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER.trim(),
            pass: process.env.SMTP_PASS.trim(),
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    return transporter.sendMail({
        from: process.env.EMAIL_FROM.trim(),
        to: to.trim(),
        subject,
        html,
    });
};