import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from '../rbac/rbac.middleware.js';
import { sendError, sendSuccess } from '../../utils/response.js';
import { resolveFileRefsDeep, safeUploadFilename, storeUploadedFile } from '../../lib/file-storage.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|pdf|doc|docx)$/i.test(file.originalname);
    cb(null, allowed);
  },
});

router.post('/', authenticateToken, requirePermission('MANAGE_STUDENT_CRM', 'VIEW_STUDENT_CRM'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return sendError(res, 'file is required (jpg, png, pdf, doc, docx, max 20MB)', null, 400);

    const storedName = safeUploadFilename(req.file.originalname);
    const relativePath = `uploads/${storedName}`;
    const { ref, url, bytesStored } = await storeUploadedFile({
      relativePath,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
    });

    const payload = await resolveFileRefsDeep({
      url,
      ref,
      filename: req.file.originalname,
      storedAs: storedName,
      size: bytesStored,
      originalSize: req.file.size,
    });

    return sendSuccess(res, 'file uploaded', payload, 201);
  } catch (err) {
    console.error('[uploads] failed', err);
    return sendError(res, 'file upload failed', null, 500);
  }
});

export default router;
