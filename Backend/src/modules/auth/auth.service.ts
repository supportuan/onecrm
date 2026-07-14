import { prisma } from '../../prisma.js';
import { UserRole } from '@prisma/client';
import { hashPassword, comparePasswords } from '../../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { adminAgentNotification, adminStudentNotification, sendCampaignEmail } from '../marketing/services/email.service.js';
import { safeNotify } from '../notifications/recipients.js';
import { getDefaultTenantId, resolveTenantForUser } from '../../utils/tenant-default.js';
import { deleteStoredFile, resolveFileRef } from '../../lib/file-storage.js';

interface RegisterData {
  fullName: string;
  email: string;
  phone?: string | null;
  password: string;
  role: UserRole;
  agencyDetails?: any;
}

export const register = async (data: RegisterData) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('Email already registered');
  // Check duplicate phone number
  if (data.phone) {
    // Check duplicate phone number using findUnique (phone should be unique)
    const existingPhone = await prisma.user.findFirst({
      where: { phone: data.phone },
    });

    if (existingPhone) {
      throw new Error('Phone number already registered');
    }
  }
  const passwordHash = await hashPassword(data.password);
  const isApproved = data.role !== UserRole.AGENT;

  // Import default permissions for the role
  const { getDefaultModuleAccessByRole } = await import('../users/user.service.js');
  const moduleAccess = getDefaultModuleAccessByRole(data.role);
  let tenantId: number | null = null;
  try {
    tenantId = await getDefaultTenantId();
  } catch (e) {
    // In test environment prisma.tenant may be undefined; default to null
    tenantId = null;
  }

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || null,
      passwordHash,
      role: data.role,
      tenantId,
      isActive: true,
      isApproved,
      agencyDetails: data.agencyDetails || null,
      moduleAccess: moduleAccess || null,
    },
  });

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || 'admin@onecrm.com';

  if (data.role === UserRole.AGENT) {
    // Notify admin
    adminAgentNotification({
      to: adminEmail,
      agentName: data.fullName,
      agentEmail: data.email,
    }).catch(err => console.error('[Admin Agent Notification Error]', err));

    // Send Welcome Email to Agent
    sendCampaignEmail({
      to: data.email,
      subject: 'Welcome to OneCRM - Agent Registration Received',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
            <tr>
              <td align="center">

                <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">

                  <!-- Header -->
                  <tr>
                    <td style="background:#0f172a;padding:28px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">
                        ONECRM
                      </h1>
                      <p style="margin-top:8px;color:#cbd5e1;font-size:14px;">
                        Agent Registration Confirmation
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">

                      <h2 style="margin-top:0;color:#111827;font-size:24px;">
                        Hello ${data.fullName},
                      </h2>

                      <p style="font-size:15px;color:#4b5563;line-height:1.8;">
                        Thank you for registering as an
                        <strong>Agent</strong> with
                        <strong>OneCRM</strong>.
                      </p>

                      <div style="
                        background:#f8fafc;
                        border-left:4px solid #2563eb;
                        padding:18px;
                        margin:25px 0;
                        border-radius:8px;
                      ">
                        <p style="margin:0;font-size:15px;color:#334155;">
                          <strong>Your registration has been received successfully.</strong>
                        </p>

                        <p style="margin-top:10px;font-size:14px;color:#475569;line-height:1.8;">
                          Before you can access your account, your registration
                          must be reviewed and approved by our administration team.
                        </p>
                      </div>

                      <h3 style="margin-bottom:10px;color:#111827;">
                        What happens next?
                      </h3>

                      <ul style="padding-left:20px;color:#4b5563;font-size:14px;line-height:2;">
                        <li>Your application will be reviewed by our administrators.</li>
                        <li>Your agency details will be verified.</li>
                        <li>Once approved, you'll receive another email confirming your account activation.</li>
                        <li>After approval, you can log in and start managing student applications through the OneCRM portal.</li>
                      </ul>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;background:#eff6ff;border-radius:10px;">
                        <tr>
                          <td style="padding:18px;">
                            <strong style="color:#1d4ed8;">Registered Email</strong>
                            <br/>
                            <span style="color:#334155;">${data.email}</span>
                          </td>
                        </tr>
                      </table>

                      <p style="font-size:14px;color:#4b5563;line-height:1.8;">
                        We appreciate your interest in partnering with us and look
                        forward to welcoming you to the OneCRM Agent Network.
                      </p>

                      <p style="margin-top:30px;font-size:15px;color:#111827;">
                        Regards,<br/>
                        <strong>OneCRM Team</strong>
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">

                      <p style="margin:0;color:#64748b;font-size:12px;">
                        This is an automated email. Please do not reply to this message.
                      </p>

                      <p style="margin-top:10px;color:#94a3b8;font-size:12px;">
                        © ${new Date().getFullYear()} OneCRM. All rights reserved.
                      </p>

                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>

        </body>
        </html>
        `,
    }).catch(err => console.error('[Agent Welcome Email Error]', err));
  } else if (data.role === UserRole.STUDENT) {
    // Notify admin
    adminStudentNotification({
      to: adminEmail,
      studentName: data.fullName,
      studentEmail: data.email,
    }).catch(err => console.error('[Admin Student Notification Error]', err));

    // Send Welcome Email to Student
    sendCampaignEmail({
      to: data.email,
      subject: 'Welcome to OneCRM - Student Account Registered',
      
      html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
          </head>
          <body style="margin:0;padding:30px;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">

                <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">

                  <!-- Header -->
                  <tr>
                    <td style="background:#0f172a;padding:24px 32px;">

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="70" valign="middle">
                            <img
                              src="https://your-domain.com/logo.png"
                              alt="OneCRM"
                              width="52"
                              height="52"
                              style="display:block;border-radius:8px;"
                            />
                          </td>

                          <td valign="middle">
                            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">
                              ONECRM
                            </h1>

                            <p style="margin:6px 0 0;color:#cbd5e1;font-size:14px;">
                              Student Registration Successful
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">

                      <h2 style="margin:0;color:#111827;font-size:24px;">
                        Welcome, ${data.fullName} 
                      </h2>

                      <p style="margin-top:20px;font-size:15px;line-height:1.8;color:#475569;">
                        Thank you for registering with
                        <strong>OneCRM</strong>.
                        Your student account has been created successfully.
                      </p>

                      <div style="
                          margin:30px 0;
                          padding:20px;
                          background:#eff6ff;
                          border-left:5px solid #2563eb;
                          border-radius:10px;
                      ">

                        <p style="margin:0;font-size:16px;font-weight:600;color:#1e3a8a;">
                          ✅ Registration Completed Successfully
                        </p>

                        <p style="margin-top:12px;font-size:14px;line-height:1.8;color:#475569;">
                          An academic counsellor will be assigned to your profile shortly.
                          Once assigned, they will contact you to guide you through your
                          university admissions and application process.
                        </p>

                      </div>

                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;margin-bottom:30px;">
                        <tr>
                          <td style="padding:18px;">

                            <strong style="color:#1e293b;">Login Email</strong>

                            <p style="margin:8px 0 0;color:#475569;">
                              ${data.email}
                            </p>

                          </td>
                        </tr>
                      </table>

                      <p style="font-size:15px;line-height:1.8;color:#475569;">
                        You can log in using your registered email address and password to
                        access your student portal, track your applications, and communicate
                        with your assigned counsellor.
                      </p>

                      <div style="text-align:center;margin-top:35px;">

                        <a
                          href="https://crm.applyuninow.com/login"
                          style="
                            display:inline-block;
                            padding:14px 32px;
                            background:#2563eb;
                            color:#ffffff;
                            text-decoration:none;
                            border-radius:8px;
                            font-size:15px;
                            font-weight:600;
                          "
                        >
                          Login to OneCRM
                        </a>

                      </div>

                      <p style="margin-top:40px;color:#111827;font-size:15px;">
                        Regards,<br/>
                        <strong>OneCRM Team</strong>
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:18px;text-align:center;">

                      <p style="margin:0;font-size:12px;color:#64748b;">
                        This is an automated email. Please do not reply directly to this message.
                      </p>

                      <p style="margin-top:10px;font-size:12px;color:#94a3b8;">
                        © ${new Date().getFullYear()} OneCRM. All rights reserved.
                      </p>

                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>

          </body>
          </html>
          `,
    }).catch(err => console.error('[Student Welcome Email Error]', err));
  }

  if (isApproved) {
    await safeNotify({
      recipientId: user.id,
      templateKey: 'welcome.user',
      vars: { name: user.fullName, role: user.role },
    });
  }

  return user;
};

export const login = async (email: string, password: string, loginType?: 'student' | 'staff') => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  });
  if (!user || !user.isActive) throw new Error('Invalid credentials');

  const isValid = await comparePasswords(password, user.passwordHash);
  if (!isValid) throw new Error('Invalid credentials');

  if (loginType === 'student' && user.role !== UserRole.STUDENT) {
    throw new Error('Invalid credentials');
  }
  if (loginType === 'staff' && user.role === UserRole.STUDENT) {
    throw new Error('Please use the student login page');
  }

  if (user.role === UserRole.AGENT && !user.isApproved) {
    throw new Error('Agent account has not been approved by an administrator yet');
  }

  // Tenant gate: SUPER_ADMIN has no tenant; everyone else must belong to an
  // ACTIVE tenant. Suspended or archived → login refused with a clear reason.
  let loginUser = user;
  if (user.role !== UserRole.SUPER_ADMIN) {
    if (!loginUser.tenant) {
      const tenantId = await resolveTenantForUser(loginUser.id, loginUser.role);
      if (!tenantId) {
        throw new Error('User is not associated with any tenant');
      }
      loginUser = await prisma.user.update({
        where: { id: loginUser.id },
        data: { tenantId },
        include: { tenant: true },
      });
    }
    if (!loginUser.tenant) {
      throw new Error('User is not associated with any tenant');
    }
    if (loginUser.tenant.status !== 'ACTIVE') {
      throw new Error(`Tenant is ${loginUser.tenant.status.toLowerCase()}; contact your administrator`);
    }
  }

  const isFirstLogin = loginUser.lastLogin === null;
  const mustChangePassword = loginUser.mustChangePassword;
  const showPolicyModal = loginUser.role === UserRole.STUDENT && !loginUser.policyAcceptedAt;

  await prisma.user.update({
    where: { id: loginUser.id },
    data: { lastLogin: new Date() },
  });

  const payload = {
    id: loginUser.id,
    email: loginUser.email,
    role: loginUser.role,
    tenantId: loginUser.tenantId ?? null,
    permissionRole: loginUser.permissionRole ?? null,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  return { user: loginUser, accessToken, refreshToken, isFirstLogin, mustChangePassword, showPolicyModal };
};

export const refreshToken = async (token: string) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new Error('Invalid refresh token');
  }

  const payload = verifyRefreshToken(token);

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || !user.isActive) throw new Error('Invalid refresh token');

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId ?? null,
    permissionRole: user.permissionRole ?? null,
  };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  await prisma.refreshToken.deleteMany({
    where: { userId: user.id, token: { not: refreshToken } },
  });

  return { accessToken, refreshToken };
};

export const logout = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

export const getUserProfile = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      profilePhotoUrl: true,
      role: true,
      roleLabel: true,
      permissionRole: true,
      tenantId: true,
      isActive: true,
      mustChangePassword: true,
      policyAcceptedAt: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      moduleAccess: true,
    },
  });
  if (!user) return null;
  return {
    ...user,
    profilePhotoUrl: (await resolveFileRef(user.profilePhotoUrl)) || null,
  };
};

/** Authenticated users may upload/replace their own profile photo. */
export const uploadProfilePhoto = async (userId: number, fileUrl: string) => {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, profilePhotoUrl: true },
  });
  if (!current) throw new Error('User not found');

  if (current.profilePhotoUrl) {
    try {
      await deleteStoredFile(current.profilePhotoUrl);
    } catch {
      /* ignore stale file cleanup */
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { profilePhotoUrl: fileUrl },
  });

  return getUserProfile(userId);
};

export const changePassword = async (userId: number, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const isValid = await comparePasswords(currentPassword, user.passwordHash);
  if (!isValid) throw new Error('Current password is incorrect');

  const passwordHash = await hashPassword(newPassword);
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false },
  });
};

export const acceptPolicy = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  if (user.role !== UserRole.STUDENT) throw new Error('Policy acceptance is only required for students');

  return prisma.user.update({
    where: { id: userId },
    data: { policyAcceptedAt: new Date() },
    select: {
      id: true,
      policyAcceptedAt: true,
    },
  });
};

export const createPasswordResetToken = async (email: string, token: string, expiresAt: Date) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Email not found');

  return prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });
};

export const verifyPasswordResetToken = async (token: string) => {
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.expiresAt < new Date()) throw new Error('Invalid or expired reset token');
  return resetToken;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const resetToken = await verifyPasswordResetToken(token);
  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
};
