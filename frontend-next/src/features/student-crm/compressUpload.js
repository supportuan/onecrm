const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.72;
const MIN_BYTES_TO_COMPRESS = 80 * 1024;

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });

/**
 * Shrink photos in the browser before upload. PDFs and office docs are returned as-is.
 */
export async function compressUploadFile(file) {
  if (!(file instanceof Blob) || !file.type?.startsWith('image/') || file.type.includes('gif')) {
    return file;
  }
  if (file.size < MIN_BYTES_TO_COMPRESS) return file;
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
    if (!blob || blob.size >= file.size) return file;
    const name = String(file.name || 'upload').replace(/\.[^.]+$/, '.jpg');
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}
