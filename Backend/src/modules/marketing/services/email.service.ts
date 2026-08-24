import { createEmailTransporter, getEmailFrom, isEmailConfigured } from '../../../lib/email-transport.js';

export const fireAndForgetEmail = (
  promise: Promise<unknown>,
  label: string,
  to?: string
) => {
  promise.catch((err) => {
    console.error(
      `[${label}] Failed to send email${to ? ` to ${to}` : ''}:`,
      err?.message || err
    );
  });
};

export const sendCampaignEmail = async ({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) => {
    if (!isEmailConfigured()) {
        throw new Error('SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM required)');
    }

    const transporter = createEmailTransporter();

    try {
        const info = await transporter.sendMail({
            from: getEmailFrom(),
            to: to.trim(),
            subject,
            html,
        });
        console.log('[EMAIL] Sent', subject, '→', to.trim(), info.messageId || '');
        return info;
    } catch (err: any) {
        console.error('[EMAIL] Send failed', subject, '→', to.trim(), err?.message || err);
        throw err;
    }
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