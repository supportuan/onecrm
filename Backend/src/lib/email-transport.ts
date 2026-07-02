import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';

/** Trim env values — trailing spaces in .env break Gmail app-password auth. */
const env = (key: string) => (process.env[key] || '').trim();

export function getSmtpConfig(): SMTPTransport.Options {
  const host = env('SMTP_HOST');
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS');
  const port = Number(env('SMTP_PORT') || 587);
  const secure =
    process.env.SMTP_SECURE !== undefined ? env('SMTP_SECURE') === 'true' : port === 465;

  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS required)');
  }

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    // Gmail on port 587 uses STARTTLS
    requireTLS: port === 587,
    tls: { minVersion: 'TLSv1.2' },
  };
}

export function createEmailTransporter() {
  return nodemailer.createTransport(getSmtpConfig());
}

/** Sender header — prefers EMAIL_FROM, then legacy SMTP_FROM, then SMTP_USER. */
export function getEmailFrom(): string {
  return env('EMAIL_FROM') || env('SMTP_FROM') || env('SMTP_USER');
}
