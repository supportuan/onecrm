import sharp from 'sharp';

const IMAGE_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export type OptimizeUploadOptions = {
  /** Max width or height in pixels (longest edge). Default 1920. */
  maxDimension?: number;
  /** JPEG/WebP quality 1–100. Default 80. */
  quality?: number;
  /**
   * Prefer JPEG for photos (smaller). PNG with alpha keeps PNG.
   * Default true.
   */
  preferJpeg?: boolean;
};

export type OptimizedUpload = {
  buffer: Buffer;
  contentType: string;
  /** When format changes (e.g. png → jpeg), new extension including the dot. */
  extension?: string;
  originalBytes: number;
  optimizedBytes: number;
  optimized: boolean;
};

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function optimizationEnabled(): boolean {
  const flag = (process.env.UPLOAD_OPTIMIZE ?? 'true').toLowerCase();
  return flag !== '0' && flag !== 'false' && flag !== 'off';
}

function looksLikeImage(contentType?: string, buffer?: Buffer): boolean {
  if (contentType && IMAGE_MIME.has(contentType.toLowerCase())) return true;
  if (!buffer || buffer.length < 12) return false;
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return true;
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  // GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return true;
  // WebP (RIFF....WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }
  return false;
}

function isPdf(contentType?: string, buffer?: Buffer): boolean {
  if (contentType?.toLowerCase() === 'application/pdf') return true;
  if (!buffer || buffer.length < 5) return false;
  return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

/**
 * Shrink uploaded photos before they hit S3 / Meta / disk.
 * PDFs are left as-is (true PDF downsizing needs Ghostscript); scanned
 * docs should be uploaded as images when possible for best savings.
 */
export async function optimizeUploadBuffer(
  buffer: Buffer,
  contentType?: string,
  options: OptimizeUploadOptions = {},
): Promise<OptimizedUpload> {
  const originalBytes = buffer.length;
  const passthrough = (): OptimizedUpload => ({
    buffer,
    contentType: contentType || 'application/octet-stream',
    originalBytes,
    optimizedBytes: originalBytes,
    optimized: false,
  });

  if (!optimizationEnabled()) return passthrough();

  if (isPdf(contentType, buffer)) {
    // PDF binary compression is not available without external tools.
    return passthrough();
  }

  if (!looksLikeImage(contentType, buffer)) return passthrough();

  const maxDimension = options.maxDimension ?? envInt('UPLOAD_IMAGE_MAX_DIMENSION', 1920);
  const quality = options.quality ?? envInt('UPLOAD_IMAGE_QUALITY', 80);
  const preferJpeg = options.preferJpeg ?? true;

  try {
    const image = sharp(buffer, { failOn: 'none', animated: false });
    const meta = await image.metadata();

    // Skip animated GIFs — sharp would flatten/drop frames.
    if (meta.format === 'gif' && (meta.pages ?? 1) > 1) return passthrough();

    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const needsResize = width > maxDimension || height > maxDimension;

    let pipeline = image.rotate(); // honor EXIF orientation
    if (needsResize) {
      pipeline = pipeline.resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const hasAlpha = Boolean(meta.hasAlpha);
    const outAsJpeg = preferJpeg && !hasAlpha;

    let out: Buffer;
    let outType: string;
    let extension: string | undefined;

    if (outAsJpeg) {
      out = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      outType = 'image/jpeg';
      if (meta.format !== 'jpeg') extension = '.jpg';
    } else if (meta.format === 'png' || hasAlpha) {
      out = await pipeline.png({ compressionLevel: 8, palette: true }).toBuffer();
      outType = 'image/png';
    } else if (meta.format === 'webp') {
      out = await pipeline.webp({ quality }).toBuffer();
      outType = 'image/webp';
    } else {
      out = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      outType = 'image/jpeg';
      extension = '.jpg';
    }

    // Only keep the result if it is actually smaller (or we resized).
    if (out.length >= originalBytes && !needsResize) {
      return passthrough();
    }

    return {
      buffer: out,
      contentType: outType,
      extension,
      originalBytes,
      optimizedBytes: out.length,
      optimized: true,
    };
  } catch (err) {
    console.warn('[optimize-upload] image optimize failed, storing original:', err);
    return passthrough();
  }
}

/** Swap file extension when optimizeUploadBuffer changes format. */
export function applyOptimizedExtension(relativePath: string, extension?: string): string {
  if (!extension) return relativePath;
  return relativePath.replace(/\.[^.]+$/, extension);
}
