#!/usr/bin/env bash
# Migrations (optional) → backend + frontend in one container.
set -euo pipefail

BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

[ -n "${DATABASE_URL:-}" ] || {
  echo "[entrypoint] FATAL: DATABASE_URL is not set." >&2
  exit 1
}

if [ -z "${SMTP_HOST:-}" ] || [ -z "${SMTP_USER:-}" ] || [ -z "${SMTP_PASS:-}" ]; then
  echo "[entrypoint] WARNING: SMTP_HOST/SMTP_USER/SMTP_PASS not set — transactional emails will fail." >&2
fi

cd /app/Backend
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] prisma migrate deploy..."
  ./node_modules/.bin/prisma migrate deploy
fi

echo "[entrypoint] backend :${BACKEND_PORT}"
PORT="${BACKEND_PORT}" node /app/Backend/dist/index.js &
BACKEND_PID=$!

NEXT_INTERNAL_PORT="${NEXT_INTERNAL_PORT:-3001}"
echo "[entrypoint] next internal :${NEXT_INTERNAL_PORT}, public edge :${FRONTEND_PORT}"
cd /app/frontend-next
PORT="${NEXT_INTERNAL_PORT}" HOSTNAME="127.0.0.1" node /app/frontend-next/server.js &
NEXT_PID=$!

export NEXT_INTERNAL_URL="http://127.0.0.1:${NEXT_INTERNAL_PORT}"
export BACKEND_INTERNAL_URL="http://127.0.0.1:${BACKEND_PORT}"
PORT="${FRONTEND_PORT}" node /app/frontend-next/edge-proxy.mjs &
EDGE_PID=$!

shutdown() {
  kill -TERM "${BACKEND_PID}" "${NEXT_PID}" "${EDGE_PID}" 2>/dev/null || true
  wait || true
}
trap shutdown TERM INT

wait -n "${BACKEND_PID}" "${NEXT_PID}" "${EDGE_PID}"
echo "[entrypoint] a service exited; stopping." >&2
shutdown
exit 1
