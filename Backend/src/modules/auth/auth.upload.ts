import multer from 'multer';
import type { Request } from 'express';

const memoryStorage = multer.memoryStorage();

const profilePhotoFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowed =
    /\.(jpg|jpeg|png|webp)$/i.test(file.originalname) &&
    /^image\/(jpeg|png|webp)$/i.test(file.mimetype || '');
  cb(null, allowed);
};

export const profilePhotoUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: profilePhotoFilter,
});
