import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/response.js';
import * as service from './communication.service.js';
import { broadcastNewMessage, broadcastThreadRead } from './communication.ws.js';

const actorFrom = (req: Request) => ({
  id: req.user!.id,
  role: req.user!.role,
  email: req.user!.email,
});

export const listConversations = async (req: Request, res: Response) => {
  try {
    const data = await service.listConversations(actorFrom(req));
    return sendSuccess(res, 'Conversations loaded', data);
  } catch (err) {
    return sendError(res, (err as Error).message || 'Failed to load conversations', null, 400);
  }
};

export const getStudentThread = async (req: Request, res: Response) => {
  try {
    const studentId = Number(req.params.studentId);
    const actor = actorFrom(req);
    const data = await service.getThread(studentId, actor);
    await service.markThreadRead(studentId, actor);
    broadcastThreadRead(studentId, actor.id);
    return sendSuccess(res, 'Thread loaded', data);
  } catch (err) {
    return sendError(res, (err as Error).message || 'Failed to load thread', null, 400);
  }
};

export const sendStudentMessage = async (req: Request, res: Response) => {
  try {
    const studentId = Number(req.params.studentId);
    const { message } = req.body ?? {};
    const data = await service.sendMessage(studentId, String(message || ''), actorFrom(req));
    broadcastNewMessage(studentId, {
      id: data.id,
      studentId: data.studentId,
      authorId: data.authorId,
      authorName: data.authorName,
      message: data.message,
      read: data.read,
      createdAt: data.createdAt,
    });
    return sendSuccess(res, 'Message sent', data);
  } catch (err) {
    return sendError(res, (err as Error).message || 'Failed to send message', null, 400);
  }
};

export const getMyThread = async (req: Request, res: Response) => {
  try {
    const actor = actorFrom(req);
    const data = await service.getMyThread(actor);
    const studentId = data.student.id;
    await service.markMyThreadRead(actor);
    broadcastThreadRead(studentId, actor.id);
    return sendSuccess(res, 'Thread loaded', data);
  } catch (err) {
    return sendError(res, (err as Error).message || 'Failed to load messages', null, 400);
  }
};

export const sendMyMessage = async (req: Request, res: Response) => {
  try {
    const { message } = req.body ?? {};
    const actor = actorFrom(req);
    const data = await service.sendMyMessage(String(message || ''), actor);
    broadcastNewMessage(data.studentId, {
      id: data.id,
      studentId: data.studentId,
      authorId: data.authorId,
      authorName: data.authorName,
      message: data.message,
      read: data.read,
      createdAt: data.createdAt,
    });
    return sendSuccess(res, 'Message sent', data);
  } catch (err) {
    return sendError(res, (err as Error).message || 'Failed to send message', null, 400);
  }
};
