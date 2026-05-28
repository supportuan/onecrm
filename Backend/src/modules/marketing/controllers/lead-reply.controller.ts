import { Request, Response, NextFunction } from 'express';
import { saveInboundReply } from '../services/lead-reply.service.js';

const sendSuccess = (res: Response, message: string, data: any = null, status = 200) => {
    return res.status(status).json({
        success: true,
        message,
        data,
    });
};

export const receiveEmailReply = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await saveInboundReply({
            channel: 'EMAIL',
            from: req.body.from,
            leadId: req.body.leadId ? Number(req.body.leadId) : undefined,
            message: req.body.message || req.body.text || req.body.body,
            providerPayload: req.body,
        });

        return sendSuccess(res, 'Email reply saved successfully', result, 201);
    } catch (error) {
        next(error);
    }
};

export const receiveSMSReply = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await saveInboundReply({
            channel: 'SMS',
            from: req.body.from,
            leadId: req.body.leadId ? Number(req.body.leadId) : undefined,
            message: req.body.message || req.body.Body || req.body.body,
            providerPayload: req.body,
        });

        return sendSuccess(res, 'SMS reply saved successfully', result, 201);
    } catch (error) {
        next(error);
    }
};

export const receiveWhatsAppReply = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await saveInboundReply({
            channel: 'WHATSAPP',
            from: req.body.from,
            leadId: req.body.leadId ? Number(req.body.leadId) : undefined,
            message: req.body.message || req.body.Body || req.body.body,
            providerPayload: req.body,
        });

        return sendSuccess(res, 'WhatsApp reply saved successfully', result, 201);
    } catch (error) {
        next(error);
    }
};

export const receiveStudentCRMReply = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await saveInboundReply({
            channel: 'STUDENT_CRM',
            leadId: Number(req.body.leadId),
            fromUserId: req.body.fromUserId ? Number(req.body.fromUserId) : undefined,
            message: req.body.message,
            providerPayload: req.body,
        });

        return sendSuccess(res, 'Student CRM reply saved successfully', result, 201);
    } catch (error) {
        next(error);
    }
};