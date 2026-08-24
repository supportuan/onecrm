import dotenv from 'dotenv';
import { createEmailTransporter, getEmailFrom, getSmtpConfig } from '../src/lib/email-transport.js';

dotenv.config();

const to = (process.argv[2] || process.env.SMTP_USER || '').trim();

async function main() {
  const config = getSmtpConfig();
  console.log('SMTP config:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: typeof config.auth === 'object' && config.auth && 'user' in config.auth ? config.auth.user : undefined,
    from: getEmailFrom(),
    to,
  });

  if (!to) throw new Error('Pass recipient: npx tsx scripts/test-email.ts user@example.com');

  const transporter = createEmailTransporter();
  const info = await transporter.sendMail({
    from: getEmailFrom(),
    to,
    subject: 'OneCRM SMTP test',
    html: '<p>If you received this, SMTP is working.</p>',
  });

  console.log('Sent:', info.messageId, info.response);
}

main().catch((err) => {
  console.error('SMTP test failed:', err?.message || err);
  if (err?.code) console.error('code:', err.code);
  if (err?.response) console.error('response:', err.response);
  process.exit(1);
});
