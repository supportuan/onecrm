/**
 * Next.js App Router route handler for Social Media media upload.
 *
 * Why this exists:
 *   Next.js rewrites() proxy has a ~1MB default body size limit. Large video
 *   files cause "Request aborted" errors inside multer before the bytes even
 *   reach the Express backend.  By handling the route here we can disable all
 *   body parsing and pipe the raw stream straight through, supporting files up
 *   to 100 MB (matching the backend multer limit).
 */

export const dynamic = 'force-dynamic';

// Tell Next.js NOT to parse the body at all for this route.
// Without this, Next.js buffers the whole request and aborts large uploads.
export const config = {
  api: {
    bodyParser: false,
  },
};

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function POST(request) {
  try {
    // Forward the raw request body (multipart stream) directly to the backend.
    // We forward all headers so that the Content-Type / boundary is preserved.
    const headers = {};
    request.headers.forEach((value, key) => {
      // Skip host — the backend will set its own
      if (key.toLowerCase() !== 'host') {
        headers[key] = value;
      }
    });

    const response = await fetch(
      `${BACKEND_URL}/api/marketing/social-media/upload-media`,
      {
        method: 'POST',
        headers,
        body: request.body,          // raw ReadableStream, no buffering
        // @ts-ignore — duplex is required when body is a stream
        duplex: 'half',
      }
    );

    const json = await response.json();

    return Response.json(json, { status: response.status });
  } catch (error) {
    console.error('[Next.js /api/marketing/social-media/upload-media] Proxy error:', error);
    return Response.json(
      { success: false, message: error.message || 'Upload proxy failed' },
      { status: 500 }
    );
  }
}
