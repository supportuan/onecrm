import { Request, Response } from 'express';
import * as studentService from './student.service.js';

const isStudentUser = (req: Request) => {
  const role = String((req as any).user?.role || '').toUpperCase();
  return role === 'STUDENT' || role === 'SUPER_ADMIN' || role === 'HR_MANAGER';
};

export const getStudents = async (_req: Request, res: Response) => {
  const data = await studentService.listStudents();
  return res.json({ success: true, data });
};

export const getMyStudentProfile = async (req: Request, res: Response) => {
  if (!isStudentUser(req)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const email = (req as any).user?.email;
  const data = await studentService.getStudentByEmail(email);
  if (!data) return res.status(404).json({ success: false, error: 'Student not found' });
  return res.json({ success: true, data });
};

export const getMyStudentDashboard = async (req: Request, res: Response) => {
  if (!isStudentUser(req)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const email = (req as any).user?.email;
  const data = await studentService.getStudentDashboard(email);
  if (!data) return res.status(404).json({ success: false, error: 'Student not found' });
  return res.json({ success: true, data });
};
