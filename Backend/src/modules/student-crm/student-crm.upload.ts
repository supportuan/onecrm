import multer from 'multer';
import type { Request } from 'express';

const memoryStorage = multer.memoryStorage();

const applicationDocFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowed = /\.(jpg|jpeg|png|pdf|doc|docx)$/i.test(file.originalname);
  cb(null, allowed);
};

export const applicationDocUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: applicationDocFilter,
});
