#!/usr/bin/env bash
# Migrations (optional) → backend + frontend in one container.
set -euo pipefail

BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

[ -n "${DATABASE_URL:-}" ] || {
  echo "[entrypoint] FATAL: DATABASE_URL is not set." >&2
  exit 1
}

cd /app/Backend
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] prisma migrate deploy..."
  ./node_modules/.bin/prisma migrate deploy
fi

echo "[entrypoint] backend :${BACKEND_PORT}"
PORT="${BACKEND_PORT}" node /app/Backend/dist/index.js &
BACKEND_PID=$!

echo "[entrypoint] frontend :${FRONTEND_PORT}"
cd /app/frontend-next
PORT="${FRONTEND_PORT}" HOSTNAME="0.0.0.0" node /app/frontend-next/server.js &
FRONTEND_PID=$!

shutdown() {
  kill -TERM "${BACKEND_PID}" "${FRONTEND_PID}" 2>/dev/null || true
  wait || true
}
trap shutdown TERM INT

wait -n "${BACKEND_PID}" "${FRONTEND_PID}"
echo "[entrypoint] a service exited; stopping." >&2
shutdown
exit 1
