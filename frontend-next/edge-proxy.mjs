/**
 * Production edge proxy: public FRONTEND_PORT → Next.js + /ws/* → backend.
 */
import { createServer } from 'node:http';
import httpProxy from 'http-proxy';

const publicPort = parseInt(process.env.PORT || process.env.FRONTEND_PORT || '3000', 10);
const nextUrl = (process.env.NEXT_INTERNAL_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const backendUrl = (process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');

const proxy = httpProxy.createProxyServer({ ws: true });

proxy.on('error', (err) => {
  console.error('[edge-proxy]', err.message);
});

const server = createServer((req, res) => {
  if (req.url?.startsWith('/ws/')) {
    proxy.web(req, res, { target: backendUrl });
    return;
  }
  proxy.web(req, res, { target: nextUrl });
});

server.on('upgrade', (req, socket, head) => {
  if (req.url?.startsWith('/ws/')) {
    proxy.ws(req, socket, head, { target: backendUrl });
    return;
  }
  proxy.ws(req, socket, head, { target: nextUrl });
});

server.listen(publicPort, '0.0.0.0', () => {
  console.log(`[edge-proxy] :${publicPort} → Next ${nextUrl}, WS → ${backendUrl}`);
});
