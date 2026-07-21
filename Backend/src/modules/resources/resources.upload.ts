import multer from 'multer';
import type { Request } from 'express';

const memoryStorage = multer.memoryStorage();

const resourceFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowed =
    /\.(jpg|jpeg|png|pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(file.originalname) ||
    /^image\/(jpeg|png|webp)$/i.test(file.mimetype || '') ||
    /^application\/pdf$/i.test(file.mimetype || '');
  cb(null, allowed);
};

export const resourceUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: resourceFileFilter,
});
