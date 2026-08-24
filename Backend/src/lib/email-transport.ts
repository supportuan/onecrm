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

  const tlsReject =
    process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== undefined
      ? env('SMTP_TLS_REJECT_UNAUTHORIZED') !== 'false'
      : true;

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    // Gmail / Office365 on port 587 use STARTTLS
    requireTLS: port === 587,
    tls: {
      minVersion: 'TLSv1.2' as const,
      ...(tlsReject ? {} : { rejectUnauthorized: false }),
    },
  };
}

export function createEmailTransporter() {
  return nodemailer.createTransport(getSmtpConfig());
}

/** Sender header — prefers EMAIL_FROM, then legacy SMTP_FROM, then SMTP_USER. */
export function getEmailFrom(): string {
  return env('EMAIL_FROM') || env('SMTP_FROM') || env('SMTP_USER');
}

export function isEmailConfigured(): boolean {
  return Boolean(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS') && getEmailFrom());
}

/** Verify SMTP connectivity at startup (non-fatal). */
export async function verifyEmailTransport(): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn('[EMAIL] SMTP not configured — emails will fail (set SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM)');
    return false;
  }

  try {
    const transporter = createEmailTransporter();
    await transporter.verify();
    console.log('[EMAIL] SMTP connection verified');
    return true;
  } catch (err: any) {
    console.error('[EMAIL] SMTP verify failed:', err?.message || err);
    return false;
  }
}
