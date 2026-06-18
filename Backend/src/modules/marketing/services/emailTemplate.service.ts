
export const buildCampaignEmailTemplate = (campaign: any, lead: any) => {
    const studentName = lead.fullName || lead.name || 'Student';
    const country = lead.preferredCountry || 'your preferred country';
    const course = lead.preferredCourse || lead.interestedIn || 'your preferred course';
    const campaignName = campaign.name || 'Study Abroad Campaign';

    return `
  <div style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:30px 0;">
      <tr>
        <td align="center">
          <table width="650" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
            
            <tr>
              <td style="background:#111827;padding:24px;text-align:center;">
                <img src="https://applyuninow.com/logo.png" alt="Apply UniNow" style="height:60px;margin-bottom:10px;" />
                <h2 style="color:#ffffff;margin:0;font-size:22px;">Apply UniNow</h2>
              </td>
            </tr>

            <tr>
              <td style="padding:30px;">
                <h2 style="color:#111827;margin:0 0 16px;">
                  Hello ${studentName},
                </h2>

                <p style="color:#374151;font-size:15px;line-height:1.7;">
                  We hope you are doing well.
                </p>

                <p style="color:#374151;font-size:15px;line-height:1.7;">
                  We are reaching out from <strong>Apply UniNow</strong>, a study abroad consultancy
                  helping students find suitable universities, courses, scholarships, and visa guidance
                  for their international education journey.
                </p>

                <p style="color:#374151;font-size:15px;line-height:1.7;">
                  If you are planning to study in <strong>${country}</strong> or exploring programs related to
                  <strong>${course}</strong>, our counsellor team can guide you with the complete admission process.
                </p>

                <div style="background:#f9fafb;border-left:4px solid #f59e0b;padding:16px;margin:22px 0;border-radius:8px;">
                  <p style="margin:0;color:#111827;font-size:15px;line-height:1.8;">
                    <strong>Campaign:</strong> ${campaignName}<br/>
                    <strong>Preferred Country:</strong> ${country}<br/>
                    <strong>Interested Course:</strong> ${course}
                  </p>
                </div>

                <p style="color:#374151;font-size:15px;line-height:1.7;">
                  Our services include:
                </p>

                <ul style="color:#374151;font-size:15px;line-height:1.8;padding-left:20px;">
                  <li>University selection</li>
                  <li>Course guidance</li>
                  <li>Scholarship assistance</li>
                  <li>Application processing</li>
                  <li>Visa support</li>
                  <li>Pre-departure guidance</li>
                </ul>

                <p style="color:#374151;font-size:15px;line-height:1.7;">
                  You can connect with our admissions team for a free consultation and understand the best
                  study options available for you.
                </p>

                <div style="text-align:center;margin:30px 0;">
                  <a href="https://applyuninow.com"
                     style="background:#f59e0b;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">
                    Explore Study Options
                  </a>
                </div>

                <p style="color:#374151;font-size:15px;line-height:1.7;">
                  Best Regards,<br/>
                  <strong>Apply UniNow Admissions Team</strong>
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#f9fafb;padding:22px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="margin:0;color:#374151;font-size:14px;">
                  Apply UniNow &lt;noreply@applyuninow.com&gt;
                </p>
                <p style="margin:8px 0;color:#6b7280;font-size:13px;">
                  Email: support@applyuninow.com | Website: www.applyuninow.com
                </p>
                <p style="margin:12px 0 0;color:#9ca3af;font-size:12px;">
                  © 2026 Apply UniNow. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
  `;
};