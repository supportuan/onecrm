import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from '../rbac/rbac.middleware.js';
import { sendError, sendSuccess } from '../../utils/response.js';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|pdf|doc|docx)$/i.test(file.originalname);
    cb(null, allowed);
  },
});

router.post('/', authenticateToken, requirePermission('MANAGE_STUDENT_CRM', 'VIEW_STUDENT_CRM'), upload.single('file'), (req, res) => {
  if (!req.file) return sendError(res, 'file is required (jpg, png, pdf, doc, docx, max 20MB)', null, 400);
  const baseUrl = process.env.UPLOAD_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;
  return sendSuccess(res, 'file uploaded', {
    url,
    filename: req.file.originalname,
    storedAs: req.file.filename,
    size: req.file.size,
  }, 201);
});

export default router;
