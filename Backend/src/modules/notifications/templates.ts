/**
 * Notification template registry.
 *
 * Templates are code-defined (not DB-backed) so they can be type-checked and
 * version-controlled. Each template declares its default channels and a
 * `build(vars)` function that renders the title, body, optional html, and
 * optional click-through link from the variables supplied at dispatch time.
 */
export type NotificationChannelKey = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';

export type RenderedNotification = {
  title: string;
  body: string;
  html?: string;
  link?: string;
};

export type NotificationTemplate = {
  key: string;
  defaultChannels: NotificationChannelKey[];
  build: (vars: Record<string, any>) => RenderedNotification;
};

/** Helper: tiny html shell so emails look acceptable without a full template engine. */
const wrapEmailHtml = (title: string, body: string, ctaUrl?: string, ctaLabel?: string) => `
<div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
  <h2 style="color: #4f46e5; margin: 0 0 16px; font-size: 18px;">${title}</h2>
  <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">${body.replace(/\n/g, '<br/>')}</p>
  ${ctaUrl ? `<a href="${ctaUrl}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 12px; font-size: 13px; text-decoration: none; font-weight: 600;">${ctaLabel || 'View details'}</a>` : ''}
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">automated notification · do not reply</p>
</div>`;

const fallbackVar = (v: any, fb = '—') => (v === undefined || v === null || v === '' ? fb : String(v));

export const TEMPLATES: Record<string, NotificationTemplate> = {
  // -------------------- Leads / conversions --------------------
  'lead.converted': {
    key: 'lead.converted',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `Lead converted to application`;
      const body = `${fallbackVar(v.studentName, 'A lead')} has been converted into a student application${v.country ? ` for ${v.country}` : ''}.`;
      const link = v.applicationId ? `/student-crm/applications?app=${v.applicationId}` : '/student-crm/applications';
      return { title, body, html: wrapEmailHtml(title, body, link, 'Open application'), link };
    },
  },

  'lead.assigned': {
    key: 'lead.assigned',
    defaultChannels: ['IN_APP'],
    build: (v) => {
      const title = `New lead assigned to you`;
      const body = `${fallbackVar(v.leadName, 'A new lead')} has been assigned to you${v.source ? ` (source: ${v.source})` : ''}.`;
      const link = v.leadId ? `/marketing/lead-management?lead=${v.leadId}` : '/marketing/lead-management';
      return { title, body, link };
    },
  },

  // -------------------- Applications --------------------
  'application.stage_changed': {
    key: 'application.stage_changed',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `Application moved to ${fallbackVar(v.stage)}`;
      const body = `${fallbackVar(v.studentName, 'Application')} · ${fallbackVar(v.university, 'university')} — stage is now ${fallbackVar(v.stage)}.`;
      const link = v.applicationId ? `/student-crm/applications?app=${v.applicationId}` : undefined;
      return { title, body, html: wrapEmailHtml(title, body, link, 'View application'), link };
    },
  },

  'application.task_assigned': {
    key: 'application.task_assigned',
    defaultChannels: ['IN_APP'],
    build: (v) => {
      const title = `Task assigned: ${fallbackVar(v.taskTitle)}`;
      const body = `You've been assigned a task on ${fallbackVar(v.studentName, 'an application')}${v.dueDate ? `. Due ${v.dueDate}` : ''}.`;
      const link = v.applicationId ? `/student-crm/applications?app=${v.applicationId}` : undefined;
      return { title, body, link };
    },
  },

  'application.task_overdue': {
    key: 'application.task_overdue',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `Overdue task: ${fallbackVar(v.taskTitle)}`;
      const body = `Task "${fallbackVar(v.taskTitle)}" on ${fallbackVar(v.studentName, 'application')} was due ${fallbackVar(v.dueDate)} and is now overdue.`;
      const link = v.applicationId ? `/student-crm/applications?app=${v.applicationId}` : undefined;
      return { title, body, html: wrapEmailHtml(title, body, link, 'Open task'), link };
    },
  },

  'application.document_missing': {
    key: 'application.document_missing',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `Missing documents`;
      const missing = Array.isArray(v.missing) ? v.missing.join(', ') : fallbackVar(v.missing);
      const body = `Application ${fallbackVar(v.applicationCode, '')} is missing: ${missing}.`;
      const link = v.applicationId ? `/student-crm/applications/${v.applicationId}` : undefined;
      return { title, body, html: wrapEmailHtml(title, body, link, 'Review application'), link };
    },
  },

  'application.document_missing_student': {
    key: 'application.document_missing_student',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `Documents needed for your application`;
      const missing = Array.isArray(v.missing) ? v.missing.join(', ') : fallbackVar(v.missing);
      const body = `Your application ${fallbackVar(v.applicationCode, '')} still needs: ${missing}. Please upload them at your earliest convenience.`;
      const link = v.applicationId ? `/applicant/applications/${v.applicationId}` : undefined;
      return { title, body, html: wrapEmailHtml(title, body, link, 'Upload documents'), link };
    },
  },

  'application.deadline_reminder': {
    key: 'application.deadline_reminder',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `Upcoming deadline — ${fallbackVar(v.university)}`;
      const body = `Application ${fallbackVar(v.applicationCode, '')} has a deadline on ${fallbackVar(v.dueDate)}.`;
      const link = v.applicationId ? `/applicant/applications/${v.applicationId}` : undefined;
      return { title, body, html: wrapEmailHtml(title, body, link, 'View application'), link };
    },
  },

  'application.offer_for_student': {
    key: 'application.offer_for_student',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `Offer received — ${fallbackVar(v.university)}`;
      const body = `You have received an offer for ${fallbackVar(v.course, 'your programme')}${v.deadline ? `. Please respond by ${v.deadline}` : ''}.`;
      const link = v.applicationId ? `/applicant/applications/${v.applicationId}` : undefined;
      return { title, body, html: wrapEmailHtml(title, body, link, 'Review offer'), link };
    },
  },

  'application.offer_decision': {
    key: 'application.offer_decision',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `Student ${fallbackVar(v.decision)} offer`;
      const body = `${fallbackVar(v.studentName)} has ${fallbackVar(v.decision)} the offer from ${fallbackVar(v.university)}.`;
      const link = v.applicationId ? `/student-crm/applications/${v.applicationId}` : undefined;
      return { title, body, html: wrapEmailHtml(title, body, link, 'View application'), link };
    },
  },

  'application.document_uploaded': {
    key: 'application.document_uploaded',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `Document uploaded`;
      const body = `${fallbackVar(v.studentName, 'A student')} uploaded "${fallbackVar(v.documentName)}" for application ${fallbackVar(v.applicationCode, '')}.`;
      const link = v.applicationId ? `/student-crm/applications/${v.applicationId}` : undefined;
      return { title, body, html: wrapEmailHtml(title, body, link, 'Review document'), link };
    },
  },

  'application.document_rejected': {
    key: 'application.document_rejected',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `Document needs re-upload`;
      const reason = v.notes ? ` Reason: ${v.notes}` : '';
      const body = `"${fallbackVar(v.documentName)}" for application ${fallbackVar(v.applicationCode, '')} was rejected.${reason}`;
      const link = v.applicationId ? `/applicant/applications/${v.applicationId}` : undefined;
      return { title, body, html: wrapEmailHtml(title, body, link, 'Re-upload document'), link };
    },
  },

  'application.offer_received': {
    key: 'application.offer_received',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `Offer received from ${fallbackVar(v.university)}`;
      const body = `${fallbackVar(v.studentName, 'Application')} has received an offer for ${fallbackVar(v.course, 'a programme')}${v.deadline ? `. Decision deadline: ${v.deadline}` : ''}.`;
      const link = v.applicationId ? `/student-crm/applications?app=${v.applicationId}` : undefined;
      return { title, body, html: wrapEmailHtml(title, body, link, 'Review offer'), link };
    },
  },

  'application.visa_update': {
    key: 'application.visa_update',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `Visa status: ${fallbackVar(v.status)}`;
      const body = `${fallbackVar(v.studentName, 'Application')} — visa status updated to ${fallbackVar(v.status)}.`;
      const link = v.applicationId ? `/student-crm/applications/${v.applicationId}` : undefined;
      return { title, body, html: wrapEmailHtml(title, body, link, 'View visa tracking'), link };
    },
  },

  'application.visa_update_student': {
    key: 'application.visa_update_student',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `Visa update — ${fallbackVar(v.university)}`;
      const body = `Your visa application status is now: ${fallbackVar(v.status)}.`;
      const link = v.applicationId ? `/applicant/applications/${v.applicationId}` : undefined;
      return { title, body, html: wrapEmailHtml(title, body, link, 'View visa status'), link };
    },
  },

  // -------------------- Agent CRM --------------------
  'agent.broadcast': {
    key: 'agent.broadcast',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `${fallbackVar(v.title, 'Update from your agency')}`;
      const body = `${fallbackVar(v.message, '')}`;
      const link = v.link || undefined;
      return { title, body, html: wrapEmailHtml(title, body, link, 'Read more'), link };
    },
  },

  'agent.application_status': {
    key: 'agent.application_status',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = `Application update — ${fallbackVar(v.studentName, 'Student')}`;
      const body = `${fallbackVar(v.studentName)}: ${fallbackVar(v.university)} / ${fallbackVar(v.course)} is now ${fallbackVar(v.stage)}.`;
      const link = v.applicationId
        ? `/agency-crm/agency-leads`
        : undefined;
      return { title, body, html: wrapEmailHtml(title, body, link, 'View referrals'), link };
    },
  },

  'agent.commission_update': {
    key: 'agent.commission_update',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const title = 'Commission update';
      const body = `Commission ${fallbackVar(v.status, 'updated')}: ${fallbackVar(v.currency, 'INR')} ${fallbackVar(v.amount, '0')} for application ${fallbackVar(v.applicationCode, '')}.`;
      const link = '/agency-crm/commission-management';
      return { title, body, html: wrapEmailHtml(title, body, link, 'View commissions'), link };
    },
  },

  // -------------------- HR --------------------
  'hr.leave_request': {
    key: 'hr.leave_request',
    defaultChannels: ['IN_APP'],
    build: (v) => {
      const title = `Leave request: ${fallbackVar(v.employeeName)}`;
      const body = `${fallbackVar(v.employeeName)} requested ${fallbackVar(v.leaveType, 'leave')} from ${fallbackVar(v.from)} to ${fallbackVar(v.to)}.`;
      return { title, body, link: '/hr/leave-management' };
    },
  },

  'hr.regularization_request': {
    key: 'hr.regularization_request',
    defaultChannels: ['IN_APP'],
    build: (v) => {
      const title = `Regularization request`;
      const body = `${fallbackVar(v.employeeName)} requested a regularization for ${fallbackVar(v.date)} (${fallbackVar(v.type)}).`;
      return { title, body, link: '/hr/attendance' };
    },
  },

  // -------------------- Admin / system --------------------
  'admin.system_alert': {
    key: 'admin.system_alert',
    defaultChannels: ['IN_APP'],
    build: (v) => {
      const title = `${fallbackVar(v.title, 'System notification')}`;
      const body = `${fallbackVar(v.message, '')}`;
      const link = v.link || undefined;
      return { title, body, link };
    },
  },

  // -------------------- Welcome --------------------
  // 'welcome.user': {
  //   key: 'welcome.user',
  //   defaultChannels: ['IN_APP', 'EMAIL'],
  //   build: (v) => {
  //     const title = `Welcome to OneCRM`;
  //     const body = `Hi ${fallbackVar(v.name, 'there')}, your account is ready. You're signed in as ${fallbackVar(v.role, 'a team member')}.`;
  //     return { title, body, html: wrapEmailHtml(title, body, '/', 'Open dashboard'), link: '/' };
  //   },
  // },
  'welcome.user': {
    key: 'welcome.user',
    defaultChannels: ['IN_APP', 'EMAIL'],
    build: (v) => {
      const name = fallbackVar(v.name, 'there');
      const role = fallbackVar(v.role, 'team member');

      const title = 'Welcome to OneCRM';

      const body = `Hi ${name}, your OneCRM account has been created successfully. You are signed in as ${role}. You can now access your dashboard and start using your assigned modules.`;

      const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
                
                <tr>
                  <td style="background:#0f172a;padding:30px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">
                      ONECRM
                    </h1>
                    <p style="margin:8px 0 0;color:#cbd5e1;font-size:14px;">
                      Account Ready
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0;color:#111827;font-size:24px;">
                      Welcome, ${name} 👋
                    </h2>

                    <p style="margin-top:18px;font-size:15px;line-height:1.8;color:#4b5563;">
                      Your OneCRM account has been created successfully.
                      You are signed in as <strong>${role}</strong>.
                    </p>

                    <div style="margin:28px 0;padding:18px;border-radius:10px;background:#f8fafc;border-left:4px solid #2563eb;">
                      <p style="margin:0;color:#334155;font-size:14px;line-height:1.7;">
                        You can now access your dashboard and start using the modules assigned to your role.
                      </p>
                    </div>

                    <div style="text-align:center;margin:34px 0;">
                      <a href="https://crm.applyuninow.com/" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;">
                        Open Dashboard
                      </a>
                    </div>

                    <p style="margin-top:30px;color:#111827;font-size:15px;">
                      Regards,<br/>
                      <strong>OneCRM Team</strong>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="background:#f8fafc;padding:18px;text-align:center;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;color:#64748b;font-size:12px;">
                      This is an automated notification from OneCRM.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

      return {
        title,
        body,
        html,
        link: '/',
      };
    },
  },
};

export const listTemplateKeys = () => Object.keys(TEMPLATES);
