import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema.js';
import { getEnabledModules } from '../rbac/tenant-modules.service.js';
import { MODULE_CATALOG } from '../rbac/rbac.constants.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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
        const { user, accessToken, refreshToken, isFirstLogin, mustChangePassword } = await authService.login(data.email, data.password);
        const enabledModules = await resolveEnabledModules(user.role, user.tenantId ?? null);
        return sendSuccess(res, 'Login successful', {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId ?? null,
                moduleAccess: user.moduleAccess,
                enabledModules,
                mustChangePassword,
            },
            accessToken,
            refreshToken,
            isFirstLogin,
            mustChangePassword,
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

export const me = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return sendError(res, 'Unauthorized', null, 401);
        const user = await authService.getUserProfile(req.user.id);
        if (!user) return sendError(res, 'User not found', null, 404);
        const enabledModules = await resolveEnabledModules(req.user.role, req.user.tenantId);
        return sendSuccess(res, 'Authenticated user retrieved successfully', {
            ...user,
            tenantId: req.user.tenantId,
            enabledModules,
        });
    } catch (error) {
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

// const sendResetEmail = async (email: string, token: string) => {
//     const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
//     console.log("resetUrl", resetUrl);
//     console.info(`Password reset link for ${email}: ${resetUrl}`);
// };

export const sendResetEmail = async (email: string, token: string) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  console.log("resetUrl", resetUrl);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Reset your One CRM password",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Password Reset</h2>
        <p>Click the button below to reset your password.</p>

        <a href="${resetUrl}"
          style="display:inline-block;background:#111827;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;">
          Reset Password
        </a>

        <p style="margin-top:20px;">Or copy this link:</p>
        <p>${resetUrl}</p>

        <p>This link will expire in 1 hour.</p>
      </div>
    `,
  });

  console.info(`Password reset email sent to ${email}`);
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = forgotPasswordSchema.parse(req.body);
        const token = createResetToken();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
        await authService.createPasswordResetToken(data.email, token, expiresAt);
        await sendResetEmail(data.email, token);
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
