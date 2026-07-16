import multer from 'multer';
import type { Request } from 'express';

const memoryStorage = multer.memoryStorage();

export const AGENCY_DOC_MAX_BYTES = 20 * 1024 * 1024;

const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|pdf|doc|docx)$/i;
const BLOCKED_EXTENSIONS = /\.(exe|bat|cmd|com|msi|scr|js|mjs|cjs|php|phtml|asp|aspx|html?|htm|svg|sh|ps1|dll|jar)$/i;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // browsers sometimes send octet-stream for docs
  'application/octet-stream',
]);

/** Reject path tricks and executable / script payloads disguised as documents. */
export const isAllowedAgencyDocument = (
  filename: string,
  mimetype?: string | null
): boolean => {
  const name = String(filename || '').trim();
  if (!name) return false;
  if (name.includes('..') || /[/\\]/.test(name)) return false;
  if (BLOCKED_EXTENSIONS.test(name)) return false;
  if (!ALLOWED_EXTENSIONS.test(name)) return false;
  if (mimetype && !ALLOWED_MIME_TYPES.has(String(mimetype).toLowerCase())) {
    return false;
  }
  return true;
};

const agencyDocFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  cb(null, isAllowedAgencyDocument(file.originalname, file.mimetype));
};

export const agencyDocUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: AGENCY_DOC_MAX_BYTES },
  fileFilter: agencyDocFileFilter,
});
