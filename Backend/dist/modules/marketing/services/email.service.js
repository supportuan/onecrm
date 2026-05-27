// // import { Resend } from 'resend';
// // export const sendCampaignEmail = async ({
// //     to,
// //     subject,
// //     html,
// // }: {
// //     to: string;
// //     subject: string;
// //     html: string;
// // }) => {
// //     if (!process.env.RESEND_API_KEY) {
// //         throw new Error('RESEND_API_KEY is not configured');
// //     }
// //     if (!process.env.EMAIL_FROM) {
// //         throw new Error('EMAIL_FROM is not configured');
// //     }
// //     const resend = new Resend(process.env.RESEND_API_KEY);
// //     return resend.emails.send({
// //         from: process.env.EMAIL_FROM,
// //         to,
// //         subject,
// //         html,
// //     });
// // };
// import nodemailer from 'nodemailer';
// export const sendCampaignEmail = async ({
//   to,
//   subject,
//   html,
// }: {
//   to: string;
//   subject: string;
//   html: string;
// }) => {
//   if (!process.env.SMTP_HOST) {
//     throw new Error('SMTP_HOST is not configured');
//   }
//   if (!process.env.SMTP_USER) {
//     throw new Error('SMTP_USER is not configured');
//   }
//   if (!process.env.SMTP_PASS) {
//     throw new Error('SMTP_PASS is not configured');
//   }
//   if (!process.env.EMAIL_FROM) {
//     throw new Error('EMAIL_FROM is not configured');
//   }
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT || 587),
//     secure: Number(process.env.SMTP_PORT) === 465,
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });
//   await transporter.verify();
//   return transporter.sendMail({
//     from: process.env.EMAIL_FROM,
//     to,
//     subject,
//     html,
//   });
// };
import nodemailer from 'nodemailer';
export const sendCampaignEmail = async ({ to, subject, html, }) => {
    console.log('[EMAIL SERVICE] SMTP mode loaded');
    if (!process.env.SMTP_HOST)
        throw new Error('SMTP_HOST is not configured');
    if (!process.env.SMTP_USER)
        throw new Error('SMTP_USER is not configured');
    if (!process.env.SMTP_PASS)
        throw new Error('SMTP_PASS is not configured');
    if (!process.env.EMAIL_FROM)
        throw new Error('EMAIL_FROM is not configured');
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
    return transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
    });
};
