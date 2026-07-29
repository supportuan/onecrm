'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getAccessToken } from '@/lib/auth/session';

const WS_PATH = '/ws/communication';
const RECONNECT_BASE_MS = 1200;
const RECONNECT_MAX_MS = 20_000;

export const COMM_WS_BUILD = 'same-origin-v3';

const isLoopback = (hostname) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';

const buildCandidates = (token) => {
  const q = `?token=${encodeURIComponent(token)}`;
  const urls = [];

  const envUrl = (process.env.NEXT_PUBLIC_WS_URL || '').replace(/\/$/, '');
  if (envUrl) {
    urls.push(`${envUrl}${WS_PATH}${q}`);
    return urls;
  }

  if (typeof window === 'undefined') return urls;

  const { protocol, hostname, host, port } = window.location;
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

  urls.push(`${wsProtocol}//${host}${WS_PATH}${q}`);

  if (isLoopback(hostname)) {
    const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '4000';
    urls.push(`${wsProtocol}//127.0.0.1:${backendPort}${WS_PATH}${q}`);
    if (hostname === 'localhost' && port && port !== '4000') {
      urls.push(`${wsProtocol}//127.0.0.1:${port}${WS_PATH}${q}`);
    }
  }

  return [...new Set(urls)];
};

/**
 * Real-time communication socket for staff + student chat.
 * @param {{ onEvent?: (event: object) => void, enabled?: boolean }} options
 */
export function useCommunicationSocket({ onEvent, enabled = true } = {}) {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const candidateIndexRef = useRef(0);
  const onEventRef = useRef(onEvent);
  const stoppedRef = useRef(false);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (typeof window === 'undefined' || !enabled || stoppedRef.current) return;

    const token = getAccessToken();
    if (!token) return;

    const candidates = buildCandidates(token);
    if (!candidates.length) return;

    disconnect();

    const idx = candidateIndexRef.current % candidates.length;
    const url = candidates[idx];

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      candidateIndexRef.current = idx;
      if (process.env.NODE_ENV !== 'production') {
        console.info(`[comm-ws ${COMM_WS_BUILD}] connected`, url.replace(/token=[^&]+/, 'token=…'));
      }
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onEventRef.current?.(payload);
      } catch {
        /* ignore */
      }
    };

    ws.onerror = () => {};

    ws.onclose = (event) => {
      wsRef.current = null;
      if (!enabled || stoppedRef.current) return;
      if (event.code === 1008 || event.code === 4001 || event.code === 4401) return;

      if (reconnectAttemptRef.current < candidates.length) {
        candidateIndexRef.current = (idx + 1) % candidates.length;
      }

      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** Math.floor(reconnectAttemptRef.current / candidates.length),
        RECONNECT_MAX_MS
      );
      reconnectAttemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(connect, delay);
    };
  }, [disconnect, enabled]);

  const subscribe = useCallback((studentId) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !studentId) return;
    ws.send(JSON.stringify({ type: 'subscribe', studentId: Number(studentId) }));
  }, []);

  useEffect(() => {
    stoppedRef.current = false;
    candidateIndexRef.current = 0;
    reconnectAttemptRef.current = 0;

    if (!enabled) {
      disconnect();
      return undefined;
    }

    const timer = setTimeout(connect, 100);
    return () => {
      stoppedRef.current = true;
      clearTimeout(timer);
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  return { subscribe, reconnect: connect };
}
