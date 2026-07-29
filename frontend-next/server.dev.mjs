/**
 * Dev server: Next.js + WebSocket proxy for /ws/* → backend.
 */
import { createServer } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import httpProxy from 'http-proxy';

const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const backendUrl = (process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');

const app = next({
  dev: true,
  hostname,
  port,
});
const handle = app.getRequestHandler();

const proxy = httpProxy.createProxyServer({
  target: backendUrl,
  ws: true,
  changeOrigin: true,
  xfwd: true,
});

proxy.on('error', (err, _req, res) => {
  console.error('[ws-proxy]', err.message);
  if (res && typeof res.writeHead === 'function' && !res.headersSent) {
    try {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('WebSocket proxy error — is the backend running on :4000?');
    } catch {
      /* socket already gone */
    }
  }
});

await app.prepare();

const server = createServer((req, res) => {
  const parsed = parse(req.url || '', true);
  if (parsed.pathname?.startsWith('/ws/')) {
    proxy.web(req, res);
    return;
  }
  handle(req, res, parsed);
});

server.on('upgrade', (req, socket, head) => {
  if (req.url?.startsWith('/ws/')) {
    proxy.ws(req, socket, head);
  }
});

server.listen(port, hostname, () => {
  console.log(`> Next + WS proxy  http://localhost:${port}`);
  console.log(`> /ws/*            → ${backendUrl}`);
});
