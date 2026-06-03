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

export const adminAgentNotification = async ({
    to,
    agentName,
    agentEmail,
}: {
    to: string;
    agentName: string;
    agentEmail: string;
}) => {
    const subject = 'New Agent Registration Pending Approval';
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #4f46e5; margin-bottom: 20px;">New Agent Registration</h2>
            <p style="color: #334155; font-size: 16px;">Agent <strong>${agentName}</strong> (<a href="mailto:${agentEmail}">${agentEmail}</a>) has registered and is awaiting your approval.</p>
            <p style="color: #334155; font-size: 14px;">Please review and approve the agent in the admin portal.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated notification.</p>
        </div>`;
    return sendCampaignEmail({ to, subject, html });
};

export const adminStudentNotification = async ({
    to,
    studentName,
    studentEmail,
}: {
    to: string;
    studentName: string;
    studentEmail: string;
}) => {
    const subject = 'New Student Registration - Assign Counselor';
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #4f46e5; margin-bottom: 20px;">New Student Registered</h2>
            <p style="color: #334155; font-size: 16px;">Student <strong>${studentName}</strong> (<a href="mailto:${studentEmail}">${studentEmail}</a>) has registered.</p>
            <p style="color: #334155; font-size: 14px;">Please assign a counsellor to this student in the admin portal.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated notification.</p>
        </div>`;
    return sendCampaignEmail({ to, subject, html });
};