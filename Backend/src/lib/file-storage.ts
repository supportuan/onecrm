import fs from 'fs';
import path from 'path';
import {
  applyOptimizedExtension,
  optimizeUploadBuffer,
  type OptimizeUploadOptions,
} from './optimize-upload.js';
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

/** Optional absolute public base (CDN / custom domain). Prefer unset — use same-origin `/uploads/...`. */
export function localUploadBaseUrl(): string | null {
  const base = (process.env.UPLOAD_BASE_URL || '').trim().replace(/\/+$/, '');
  return base || null;
}

/** Browser-facing path for a local upload (same-origin so Next can proxy `/uploads`). */
export function localUploadPublicRef(relativePath: string): string {
  const pathPart = `/${relativePath.replace(/^\/+/, '')}`;
  const base = localUploadBaseUrl();
  return base ? `${base}${pathPart}` : pathPart;
}

/**
 * Rewrite legacy absolute local URLs (e.g. http://localhost:4000/uploads/...) to a
 * browser-safe same-origin path, or UPLOAD_BASE_URL if configured.
 */
export function toPublicUploadUrl(refOrUrl: string): string {
  const relative = uploadsRelativeFromLocalUrl(refOrUrl);
  if (!relative) return refOrUrl;
  return localUploadPublicRef(relative);
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

function preferLocalStorage(): boolean {
  const mode = (process.env.UPLOAD_STORAGE || '').toLowerCase();
  return mode === 'local' || mode === 'disk';
}

/** Confirm a just-uploaded S3 object can actually be downloaded (Put≠Get for quarantined keys). */
async function isSignedUrlReadable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } });
    // 200 full body or 206 partial are fine; 403/404 mean browsers can't show the file.
    return res.ok || res.status === 206;
  } catch {
    return false;
  }
}

function writeLocalUpload(
  relativePath: string,
  buffer: Buffer,
): { ref: string; url: string } {
  const absPath = localPathFromUploadsRelative(relativePath);
  const dir = path.dirname(absPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(absPath, buffer);
  const ref = localUploadPublicRef(relativePath);
  return { ref, url: ref };
}

/** Persist a buffer and return the stored ref (s3:… or same-origin /uploads path). */
export async function storeUploadedFile(params: {
  relativePath: string;
  buffer: Buffer;
  contentType?: string;
  /** Skip auto-resize/compress (e.g. already-optimized HTML). */
  skipOptimize?: boolean;
  optimizeOptions?: OptimizeUploadOptions;
}): Promise<{ ref: string; url: string; bytesStored: number; optimized: boolean }> {
  const { skipOptimize, optimizeOptions } = params;
  let { relativePath, buffer, contentType } = params;
  let optimized = false;

  if (!skipOptimize) {
    const result = await optimizeUploadBuffer(buffer, contentType, optimizeOptions);
    buffer = result.buffer;
    contentType = result.contentType;
    relativePath = applyOptimizedExtension(relativePath, result.extension);
    optimized = result.optimized;
    if (optimized) {
      console.log(
        `[file-storage] optimized upload ${result.originalBytes} → ${result.optimizedBytes} bytes (${relativePath})`,
      );
    }
  }

  if (isS3Configured() && !preferLocalStorage()) {
    try {
      const key = buildS3Key(relativePath);
      await putObject(key, buffer, contentType);
      const url = await getPresignedGetUrl(key);
      if (await isSignedUrlReadable(url)) {
        return { ref: toS3Ref(key), url, bytesStored: buffer.length, optimized };
      }
      console.warn(
        `[file-storage] S3 object not readable after upload (GetObject denied?). Falling back to local disk for ${relativePath}`,
      );
      try {
        await deleteObject(key);
      } catch {
        /* orphan ok — keys may deny Delete too */
      }
    } catch (err) {
      console.warn('[file-storage] S3 upload failed; falling back to local disk:', err);
    }
  }

  const local = writeLocalUpload(relativePath, buffer);
  return { ref: local.ref, url: local.url, bytesStored: buffer.length, optimized };
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

/** Resolve a stored ref to a browser-accessible URL (presigned for S3; rewrite local hostnames). */
export async function resolveFileRef(
  ref: string | null | undefined,
): Promise<string | null | undefined> {
  if (!ref) return ref;

  const s3Key = parseS3Ref(ref);
  if (s3Key) {
    if (!isS3Configured()) return ref;
    return getPresignedGetUrl(s3Key);
  }

  // Legacy DB rows often stored http://localhost:4000/uploads/... — fix at read time.
  return toPublicUploadUrl(ref);
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
