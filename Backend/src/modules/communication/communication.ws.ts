import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyAccessToken } from '../../utils/jwt.js';
import { isStudentRole, resolveStudentScopeWhere } from '../student-crm/scoping.js';
import { assertStudentAccess, resolveStudentForActor } from './communication.service.js';
import { prisma } from '../../prisma.js';

type WsUser = { id: number; role?: string; email?: string | null };

type ClientSocket = WebSocket & {
  user?: WsUser;
  subscribedStudentIds?: Set<number>;
  isAlive?: boolean;
};

export type ChatMessagePayload = {
  id: number;
  studentId: number;
  authorId: number;
  authorName: string;
  message: string;
  read: boolean;
  createdAt: Date | string;
};

const WS_PATH = '/ws/communication';
const clients = new Set<ClientSocket>();

const sendJson = (ws: WebSocket, payload: unknown) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

const broadcastToStudentRoom = (studentId: number, payload: unknown, excludeUserId?: number) => {
  for (const client of clients) {
    if (client.readyState !== WebSocket.OPEN || !client.user) continue;
    if (excludeUserId != null && client.user.id === excludeUserId) continue;
    if (!client.subscribedStudentIds?.has(studentId)) continue;
    sendJson(client, payload);
  }
};

export const broadcastNewMessage = (studentId: number, message: ChatMessagePayload) => {
  broadcastToStudentRoom(studentId, {
    type: 'message.new',
    studentId,
    message,
  });
};

export const broadcastThreadRead = (studentId: number, readerId: number) => {
  broadcastToStudentRoom(
    studentId,
    {
      type: 'thread.read',
      studentId,
      readerId,
    },
    readerId
  );
};

const autoSubscribeForUser = async (client: ClientSocket) => {
  const user = client.user!;
  client.subscribedStudentIds = new Set();

  if (isStudentRole(user.role)) {
    try {
      const student = await resolveStudentForActor(user);
      client.subscribedStudentIds.add(student.id);
    } catch {
      /* student profile missing */
    }
    return;
  }

  const scope = await resolveStudentScopeWhere(user);
  const students = await prisma.student.findMany({
    where: scope,
    select: { id: true },
    take: 200,
  });
  for (const s of students) client.subscribedStudentIds.add(s.id);
};

const handleClientMessage = async (client: ClientSocket, raw: string) => {
  if (!client.user) return;

  let parsed: { type?: string; studentId?: number; studentIds?: number[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    sendJson(client, { type: 'error', message: 'Invalid JSON' });
    return;
  }

  if (parsed.type === 'ping') {
    sendJson(client, { type: 'pong' });
    return;
  }

  if (parsed.type === 'subscribe') {
    const ids = Array.isArray(parsed.studentIds)
      ? parsed.studentIds
      : parsed.studentId != null
        ? [parsed.studentId]
        : [];

    if (!client.subscribedStudentIds) client.subscribedStudentIds = new Set();

    for (const id of ids) {
      const studentId = Number(id);
      if (!Number.isFinite(studentId) || studentId <= 0) continue;
      try {
        await assertStudentAccess(studentId, client.user);
        client.subscribedStudentIds.add(studentId);
      } catch {
        sendJson(client, { type: 'error', message: `Access denied for student ${studentId}` });
      }
    }

    sendJson(client, {
      type: 'subscribed',
      studentIds: [...client.subscribedStudentIds],
    });
  }
};

export const attachCommunicationWebSocket = (server: HttpServer) => {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname !== WS_PATH) return;

    if ((req as { _wsHandled?: boolean })._wsHandled) return;
    (req as { _wsHandled?: boolean })._wsHandled = true;

    const token = url.searchParams.get('token');
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    let user: WsUser;
    try {
      const payload = verifyAccessToken(token);
      user = {
        id: payload.id,
        role: payload.role as string,
        email: payload.email ?? null,
      };
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      const client = ws as ClientSocket;
      client.user = user;
      client.isAlive = true;
      clients.add(client);

      void autoSubscribeForUser(client).then(() => {
        sendJson(client, {
          type: 'connected',
          userId: user.id,
          studentIds: [...(client.subscribedStudentIds || [])],
        });
      });

      client.on('pong', () => {
        client.isAlive = true;
      });

      client.on('message', (data) => {
        void handleClientMessage(client, data.toString());
      });

      client.on('close', () => {
        clients.delete(client);
      });
    });
  });

  const heartbeat = setInterval(() => {
    for (const client of clients) {
      if (!client.isAlive) {
        client.terminate();
        clients.delete(client);
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, 30_000);

  wss.on('close', () => clearInterval(heartbeat));

  console.log(`[ApplyUniNow] Communication WebSocket available at ${WS_PATH}`);
};
