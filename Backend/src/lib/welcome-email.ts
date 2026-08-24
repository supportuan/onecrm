import { fireAndForgetEmail, sendCampaignEmail } from '../modules/marketing/services/email.service.js';
import { getStudentLoginUrl } from '../utils/frontend-url.js';

export type WelcomeCredentialsOpts = {
  to: string;
  fullName: string;
  email: string;
  temporaryPassword: string;
  displayRole: string;
  loginUrl: string;
  /** Extra note below credentials (e.g. pending approval). */
  statusNote?: string;
};

const buildWelcomeCredentialsHtml = (opts: WelcomeCredentialsOpts): string => {
  const statusBlock = opts.statusNote
    ? `
        <div style="background:#EFF6FF;border-left:5px solid #3B82F6;padding:18px;border-radius:8px;margin-top:25px;">
          <p style="margin:0;font-size:14px;color:#1E40AF;line-height:24px;">${opts.statusNote}</p>
        </div>`
    : '';

  return `
          <div style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="650" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,.08);">
                    <tr>
                      <td style="background:#0f172a;padding:30px;text-align:center;">
                        <h1 style="margin:0;color:#ffffff;font-size:30px;font-weight:700;">
                          Welcome to ApplyUniNow
                        </h1>
                        <p style="margin-top:10px;color:#E0E7FF;font-size:15px;">
                          Smart CRM Platform for Education & Business Management
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px;">
                        <p style="font-size:17px;color:#334155;margin:0 0 20px;">
                          Hello <strong>${opts.fullName}</strong>,
                        </p>
                        <p style="font-size:15px;line-height:28px;color:#475569;margin-bottom:25px;">
                          Your <strong>ApplyUniNow</strong> account has been created.
                          You have been assigned the role of
                          <strong style="color:#4F46E5;">${opts.displayRole}</strong>.
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0"
                          style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;margin:25px 0;">
                          <tr>
                            <td style="padding:25px;">
                              <h3 style="margin:0 0 18px;color:#1E293B;font-size:18px;">
                                Login credentials
                              </h3>
                              <table width="100%" cellpadding="8">
                                <tr>
                                  <td width="170" style="font-weight:600;color:#64748B;">Email</td>
                                  <td style="color:#1E293B;">${opts.email}</td>
                                </tr>
                                <tr>
                                  <td style="font-weight:600;color:#64748B;">Temporary password</td>
                                  <td style="color:#DC2626;font-weight:700;font-size:16px;">${opts.temporaryPassword}</td>
                                </tr>
                                <tr>
                                  <td style="font-weight:600;color:#64748B;">Role</td>
                                  <td style="color:#4F46E5;font-weight:600;">${opts.displayRole}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <div style="text-align:center;margin:35px 0;">
                          <a href="${opts.loginUrl}"
                            style="background:#4F46E5;color:#ffffff;text-decoration:none;padding:14px 35px;border-radius:10px;display:inline-block;font-size:15px;font-weight:600;">
                            Sign in to ApplyUniNow
                          </a>
                        </div>
                        ${statusBlock}
                        <div style="background:#FEFCE8;border-left:5px solid #EAB308;padding:18px;border-radius:8px;margin-top:25px;">
                          <strong style="color:#92400E;">Security reminder</strong>
                          <p style="margin-top:10px;font-size:14px;color:#57534E;line-height:24px;">
                            This password is temporary. Change it after your first login and do not share your credentials.
                          </p>
                        </div>
                        <p style="margin-top:30px;font-size:15px;color:#334155;">
                          Best regards,<br>
                          <strong>ApplyUniNow Team</strong>
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#F8FAFC;padding:25px;text-align:center;border-top:1px solid #E2E8F0;">
                        <p style="margin:0;font-size:13px;color:#64748B;">
                          © ${new Date().getFullYear()} ApplyUniNow. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>`;
};

export const sendWelcomeCredentialsEmail = async (opts: WelcomeCredentialsOpts) =>
  sendCampaignEmail({
    to: opts.to,
    subject: 'Welcome to ApplyUniNow - Your Account Details',
    html: buildWelcomeCredentialsHtml(opts),
  });

export const sendWelcomeCredentialsEmailAsync = (
  opts: WelcomeCredentialsOpts,
  label = 'Welcome Email'
) => {
  fireAndForgetEmail(sendWelcomeCredentialsEmail(opts), label, opts.to);
};

export const sendStudentWelcomeCredentialsEmailAsync = (
  opts: Omit<WelcomeCredentialsOpts, 'displayRole' | 'loginUrl'> & {
    loginUrl?: string;
    statusNote?: string;
  }
) => {
  sendWelcomeCredentialsEmailAsync(
    {
      ...opts,
      displayRole: 'Student',
      loginUrl: opts.loginUrl || getStudentLoginUrl(),
      statusNote:
        opts.statusNote ||
        'Sign in at the student portal to view applications, upload documents, and track your progress.',
    },
    'Student Welcome Email'
  );
};
