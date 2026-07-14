import fs from 'fs';
import path from 'path';
import {
  buildS3Key,
  deleteObject,
  getObjectBuffer,
  getPresignedGetUrl,
  isS3Configured,
  parseS3Ref,
  putObject,
  toS3Ref,
} from './s3.js';

const FILE_URL_FIELDS = new Set([
  'fileUrl',
  'resumeUrl',
  'attachmentUrl',
  'logo',
  'url',
  'profilePhotoUrl',
]);

export function safeUploadFilename(original: string): string {
  const safe = original.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}-${safe}`;
}

export function localUploadBaseUrl(): string {
  return process.env.UPLOAD_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
}

export function localPathFromUploadsRelative(relativePath: string): string {
  return path.join(process.cwd(), relativePath.replace(/^\/+/, ''));
}

export function uploadsRelativeFromLocalUrl(url: string): string | null {
  const match = url.match(/\/uploads\/(.+?)(?:\?.*)?$/);
  if (!match) return null;
  return `uploads/${match[1]}`;
}

export function isS3Ref(value: string): boolean {
  return value.startsWith('s3:');
}

/** Persist a buffer and return the stored ref (s3:… or legacy http URL). */
export async function storeUploadedFile(params: {
  relativePath: string;
  buffer: Buffer;
  contentType?: string;
}): Promise<{ ref: string; url: string }> {
  const { relativePath, buffer, contentType } = params;

  if (isS3Configured()) {
    const key = buildS3Key(relativePath);
    await putObject(key, buffer, contentType);
    const ref = toS3Ref(key);
    const url = await getPresignedGetUrl(key);
    return { ref, url };
  }

  const absPath = localPathFromUploadsRelative(relativePath);
  const dir = path.dirname(absPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(absPath, buffer);

  const ref = `${localUploadBaseUrl()}/${relativePath.replace(/^\/+/, '')}`;
  return { ref, url: ref };
}

/** Read file bytes from S3 or local disk using a stored ref or legacy URL. */
export async function readStoredFile(refOrUrl: string): Promise<Buffer> {
  const s3Key = parseS3Ref(refOrUrl);
  if (s3Key) return getObjectBuffer(s3Key);

  const relative = uploadsRelativeFromLocalUrl(refOrUrl);
  if (relative) {
    const abs = localPathFromUploadsRelative(relative);
    if (fs.existsSync(abs)) return fs.readFileSync(abs);
  }

  throw new Error(`File not found for ref: ${refOrUrl}`);
}

/** Delete a stored file from S3 or local disk. */
export async function deleteStoredFile(refOrUrl: string): Promise<void> {
  const s3Key = parseS3Ref(refOrUrl);
  if (s3Key && isS3Configured()) {
    await deleteObject(s3Key);
    return;
  }
  const relative = uploadsRelativeFromLocalUrl(refOrUrl);
  if (relative) {
    const abs = localPathFromUploadsRelative(relative);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  }
}

/** Resolve a stored ref to a browser-accessible URL (presigned for S3). */
export async function resolveFileRef(
  ref: string | null | undefined,
): Promise<string | null | undefined> {
  if (!ref) return ref;

  const s3Key = parseS3Ref(ref);
  if (s3Key) {
    if (!isS3Configured()) return ref;
    return getPresignedGetUrl(s3Key);
  }

  return ref;
}

/** Walk API payloads and presign any s3: refs in known file fields. */
export async function resolveFileRefsDeep<T>(value: T): Promise<T> {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    const resolved = await Promise.all(value.map((item) => resolveFileRefsDeep(item)));
    return resolved as T;
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (FILE_URL_FIELDS.has(key) && typeof val === 'string') {
        out[key] = await resolveFileRef(val);
      } else {
        out[key] = await resolveFileRefsDeep(val);
      }
    }
    return out as T;
  }

  return value;
}

/** Convert a legacy local URL to an s3: ref (does not upload). */
export function localUrlToS3Ref(url: string): string | null {
  const relative = uploadsRelativeFromLocalUrl(url);
  if (!relative) return null;
  return toS3Ref(buildS3Key(relative));
}
