import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, acceptPolicySchema } from './auth.schema.js';
import { getEnabledModules } from '../rbac/tenant-modules.service.js';
import { MODULE_CATALOG } from '../rbac/rbac.constants.js';
import crypto from 'crypto';
import { createEmailTransporter, getEmailFrom } from '../../lib/email-transport.js';



// Super admin operates cross-tenant, so they "have" every module.
const allModuleKeys = () => MODULE_CATALOG.map((m) => m.key);

const resolveEnabledModules = async (
    role: string,
    tenantId: number | null,
): Promise<string[]> => {
    if (role === 'SUPER_ADMIN') return allModuleKeys();
    if (tenantId == null) return [];
    const set = await getEnabledModules(tenantId);
    return Array.from(set);
};

const createResetToken = () => crypto.randomBytes(32).toString('hex');

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = registerSchema.parse(req.body);
        if (data.role !== 'STUDENT' && data.role !== 'AGENT') {
            return sendError(res, 'Only student and agent self-registration is allowed via this endpoint', null, 403);
        }

        const user = await authService.register(data);
        return sendSuccess(res, 'Registration successful', {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
        }, 201);
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = loginSchema.parse(req.body);
        const { user, accessToken, refreshToken, isFirstLogin, mustChangePassword, showPolicyModal } =
            await authService.login(data.email, data.password, data.type);
        const enabledModules = await resolveEnabledModules(user.role, user.tenantId ?? null);
        const { countPendingAcknowledgements } = await import('../resources/resources.service.js');
        const pendingResourceAcknowledgements = await countPendingAcknowledgements({
            userId: user.id,
            role: user.role as any,
            tenantId: user.tenantId ?? null,
        });

        const { resolveFileRef } = await import('../../lib/file-storage.js');
        const profilePhotoUrl = (await resolveFileRef(user.profilePhotoUrl)) || null;

        return sendSuccess(res, 'Login successful', {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                roleLabel: user.roleLabel ?? null,
                permissionRole: user.permissionRole ?? null,
                tenantId: user.tenantId ?? null,
                moduleAccess: user.moduleAccess,
                enabledModules,
                mustChangePassword,
                policyAcceptedAt: user.policyAcceptedAt ?? null,
                showPolicyModal,
                profilePhotoUrl,
                pendingResourceAcknowledgements,
            },
            accessToken,
            refreshToken,
            isFirstLogin,
            mustChangePassword,
            showPolicyModal,
        });
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = refreshTokenSchema.parse(req.body);
        const tokens = await authService.refreshToken(data.refreshToken);
        return sendSuccess(res, 'Token refreshed successfully', tokens);
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
        if (!refreshToken) {
            return sendError(res, 'Refresh token is required to logout', null, 400);
        }
        await authService.logout(refreshToken as string);
        return sendSuccess(res, 'Logout successful', null);
    } catch (error) {
        next(error);
    }
};

// export const me = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         if (!req.user) return sendError(res, 'Unauthorized', null, 401);
//         const user = await authService.getUserProfile(req.user.id);
//         if (!user) return sendError(res, 'User not found', null, 404);
//         const enabledModules = await resolveEnabledModules(req.user.role, req.user.tenantId);
//         return sendSuccess(res, 'Authenticated user retrieved successfully', {
//             ...user,
//             tenantId: req.user.tenantId,
//             enabledModules,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

export const me = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return sendError(res, 'Unauthorized', null, 401);
        }

        const authenticatedUser = req.user;
        const user = await authService.getUserProfile(authenticatedUser.id);

        if (!user) {
            return sendError(res, 'User not found', null, 404);
        }

        let enabledModules: string[] = [];

        try {
            enabledModules = await resolveEnabledModules(
                authenticatedUser.role,
                authenticatedUser.tenantId ?? user.tenantId ?? null
            );
        } catch (moduleError) {
            console.error('Failed to resolve enabled modules:', moduleError);
            enabledModules =
                authenticatedUser.role === 'SUPER_ADMIN' ? allModuleKeys() : [];
        }

        return sendSuccess(res, 'Authenticated user retrieved successfully', {
            ...user,
            tenantId: authenticatedUser.tenantId ?? user.tenantId ?? null,
            enabledModules,
            pendingResourceAcknowledgements: await (async () => {
                try {
                    const { countPendingAcknowledgements } = await import('../resources/resources.service.js');
                    return await countPendingAcknowledgements({
                        userId: authenticatedUser.id,
                        role: authenticatedUser.role as any,
                        tenantId: authenticatedUser.tenantId ?? user.tenantId ?? null,
                    });
                } catch {
                    return 0;
                }
            })(),
        });
    } catch (error) {
        next(error);
    }
};

export const uploadProfilePhoto = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) return sendError(res, 'Unauthorized', null, 401);
        const file = req.file;
        if (!file) {
            return sendError(res, 'image is required (jpg, jpeg, png, webp, max 5MB)', null, 400);
        }

        const { safeUploadFilename, storeUploadedFile } = await import('../../lib/file-storage.js');
        const storedName = safeUploadFilename(file.originalname);
        const relativePath = `uploads/users/profiles/${req.user.id}/${storedName}`;
        const { ref: fileUrl } = await storeUploadedFile({
            relativePath,
            buffer: file.buffer,
            contentType: file.mimetype,
        });

        const updated = await authService.uploadProfilePhoto(req.user.id, fileUrl);
        let enabledModules: string[] = [];
        try {
            enabledModules = await resolveEnabledModules(
                req.user.role,
                req.user.tenantId ?? updated?.tenantId ?? null
            );
        } catch {
            enabledModules = req.user.role === 'SUPER_ADMIN' ? allModuleKeys() : [];
        }

        return sendSuccess(res, 'profile photo updated', {
            ...updated,
            tenantId: req.user.tenantId ?? updated?.tenantId ?? null,
            enabledModules,
        });
    } catch (error: any) {
        if (error?.message?.includes('not found')) return sendError(res, error.message, null, 404);
        next(error);
    }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return sendError(res, 'Unauthorized', null, 401);
        const data = changePasswordSchema.parse(req.body);
        await authService.changePassword(req.user.id, data.currentPassword, data.newPassword);
        return sendSuccess(res, 'Password changed successfully', null);
    } catch (error) {
        next(error);
    }
};

export const acceptPolicy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return sendError(res, 'Unauthorized', null, 401);
        acceptPolicySchema.parse(req.body);
        const result = await authService.acceptPolicy(req.user.id);
        return sendSuccess(res, 'Policy accepted', result);
    } catch (error) {
        next(error);
    }
};

// const sendResetEmail = async (email: string, token: string) => {
//     const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
//     console.log("resetUrl", resetUrl);
//     console.info(`Password reset link for ${email}: ${resetUrl}`);
// };

const resolveFrontendBaseUrl = (req?: Request): string => {
    const fromEnv = (process.env.FRONTEND_URL || '').trim().replace(/\/$/, '');
    if (fromEnv) return fromEnv;

    const origin = typeof req?.headers?.origin === 'string' ? req.headers.origin.trim() : '';
    if (origin && /^https?:\/\//i.test(origin) && !/localhost|127\.0\.0\.1/i.test(origin)) {
        return origin.replace(/\/$/, '');
    }

    const referer = typeof req?.headers?.referer === 'string' ? req.headers.referer.trim() : '';
    if (referer) {
        try {
            const u = new URL(referer);
            if (u.protocol === 'http:' || u.protocol === 'https:') {
                if (!/localhost|127\.0\.0\.1/i.test(u.hostname)) {
                    return `${u.protocol}//${u.host}`;
                }
            }
        } catch {
            /* ignore bad referer */
        }
    }

    return 'http://localhost:3000';
};

export const sendResetEmail = async (email: string, token: string, req?: Request) => {
    const frontendUrl = resolveFrontendBaseUrl(req);
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    console.info(`Password reset email queued for recipient`);
    // Do not log the reset URL/token — that enables account takeover from logs.

    const transporter = createEmailTransporter();

    await transporter.sendMail({
        from: getEmailFrom(),
        to: email,
        subject: "Reset your ApplyUniNow password",
        //     html: `
        //   <div style="font-family: Arial, sans-serif;">
        //     <h2>Password Reset</h2>
        //     <p>Click the button below to reset your password.</p>

        //     <a href="${resetUrl}"
        //       style="display:inline-block;background:#111827;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;">
        //       Reset Password
        //     </a>

        //     <p style="margin-top:20px;">Or copy this link:</p>
        //     <p>${resetUrl}</p>

        //     <p>This link will expire in 1 hour.</p>
        //   </div>
        // `,

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
                                alt="ApplyUniNow"
                                width="52"
                                height="52"
                                style="display:block;border-radius:8px;"
                            />
                            </td>   

                            <td valign="middle">
                            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">
                                ApplyUniNow
                            </h1>

                            <p style="margin:6px 0 0;color:#cbd5e1;font-size:14px;">
                                Password Reset Request
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
                        Reset Your Password
                        </h2>

                        <p style="margin-top:20px;font-size:15px;line-height:1.8;color:#475569;">
                        We received a request to reset the password for your
                        <strong>ApplyUniNow</strong> account.
                        </p>

                        <div style="
                        margin:30px 0;
                        padding:20px;
                        background:#eff6ff;
                        border-left:5px solid #2563eb;
                        border-radius:10px;
                        ">
                        <p style="margin:0;font-size:15px;color:#1e3a8a;font-weight:600;">
                            Click the button below to create a new password.
                        </p>
                        </div>

                        <div style="text-align:center;margin:35px 0;">

                        <a
                            href="${resetUrl}"
                            style="
                            display:inline-block;
                            padding:14px 34px;
                            background:#2563eb;
                            color:#ffffff;
                            text-decoration:none;
                            border-radius:8px;
                            font-size:15px;
                            font-weight:600;
                            "
                        >
                            Reset Password
                        </a>

                        </div>

                        <p style="font-size:14px;color:#475569;line-height:1.8;">
                        If the button above doesn't work, copy and paste the following
                        link into your browser:
                        </p>

                        <div style="
                        margin-top:15px;
                        padding:15px;
                        background:#f8fafc;
                        border:1px solid #e2e8f0;
                        border-radius:8px;
                        word-break:break-all;
                        color:#2563eb;
                        font-size:13px;
                        ">
                        ${resetUrl}
                        </div>

                        <div style="
                        margin-top:30px;
                        padding:18px;
                        background:#fff7ed;
                        border-left:5px solid #f59e0b;
                        border-radius:10px;
                        ">
                        <strong style="color:#92400e;">
                            Security Notice
                        </strong>

                        <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:#7c2d12;">
                            • This password reset link is valid for <strong>1 hour</strong>.<br/>
                            • If you did not request a password reset, you can safely ignore this email.
                            Your password will remain unchanged.
                        </p>
                        </div>

                        <p style="margin-top:35px;font-size:15px;color:#111827;">
                        Regards,<br/>
                        <strong>ApplyUniNow Team</strong>
                        </p>

                    </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                    <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:18px;text-align:center;">

                        <p style="margin:0;font-size:12px;color:#64748b;">
                        This is an automated email. Please do not reply to this message.
                        </p>

                        <p style="margin-top:10px;font-size:12px;color:#94a3b8;">
                        © ${new Date().getFullYear()} ApplyUniNow. All rights reserved.
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
    });

    console.info(`Password reset email sent to ${email}`);
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = forgotPasswordSchema.parse(req.body);
        const token = createResetToken();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
        const created = await authService.createPasswordResetToken(data.email, token, expiresAt);
        if (created) {
            await sendResetEmail(data.email, token, req);
        }
        // Always the same response — do not reveal whether the email exists.
        return sendSuccess(res, 'Password reset instructions sent if the email exists', null);
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = resetPasswordSchema.parse(req.body);
        await authService.resetPassword(data.token, data.newPassword);
        return sendSuccess(res, 'Password has been reset successfully', null);
    } catch (error) {
        next(error);
    }
};
