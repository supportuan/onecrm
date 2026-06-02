import { Request, Response, NextFunction } from 'express';
import {
  sendLeadEmail,
  sendLeadSMS,
  sendLeadWhatsApp,
  scheduleLeadMeeting,
} from '../services/lead-communication.service.js';

const sendSuccess = (res: Response, message: string, data: any = null, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const sendEmailToLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leadId = Number(req.params.id);

    if (Number.isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead ID',
      });
    }

    const result = await sendLeadEmail(leadId, req.body);

    return sendSuccess(res, 'Email sent successfully', result);
  } catch (error) {
    next(error);
  }
};

export const sendSMSToLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leadId = Number(req.params.id);

    if (Number.isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead ID',
      });
    }

    const result = await sendLeadSMS(leadId, req.body);

    return sendSuccess(res, 'SMS sent successfully', result);
  } catch (error) {
    next(error);
  }
};

export const sendWhatsAppToLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leadId = Number(req.params.id);

    if (Number.isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead ID',
      });
    }

    const result = await sendLeadWhatsApp(leadId, req.body);

    return sendSuccess(res, 'WhatsApp message sent successfully', result);
  } catch (error) {
    next(error);
  }
};

export const scheduleMeetingForLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leadId = Number(req.params.id);

    if (Number.isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead ID',
      });
    }

    const result = await scheduleLeadMeeting(leadId, req.body);

    return sendSuccess(res, 'Meeting scheduled successfully', result);
  } catch (error) {
    next(error);
  }
};