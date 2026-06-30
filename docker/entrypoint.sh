#!/usr/bin/env bash
# Starts the backend (Express) and frontend (Next.js standalone) in one
# container, after applying any pending DB migrations.
set -euo pipefail

BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] FATAL: DATABASE_URL is not set. Provide it at runtime (-e DATABASE_URL=...)." >&2
  exit 1
fi

cd /app/Backend

# Apply migrations on boot unless explicitly disabled (RUN_MIGRATIONS=false).
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Applying database migrations (prisma migrate deploy)..."
  ./node_modules/.bin/prisma migrate deploy
fi

echo "[entrypoint] Starting backend on :${BACKEND_PORT}"
PORT="${BACKEND_PORT}" node /app/Backend/dist/index.js &
BACKEND_PID=$!

echo "[entrypoint] Starting frontend on :${FRONTEND_PORT}"
cd /app/frontend-next
PORT="${FRONTEND_PORT}" HOSTNAME="0.0.0.0" node /app/frontend-next/server.js &
FRONTEND_PID=$!

shutdown() {
  echo "[entrypoint] Shutting down..."
  kill -TERM "${BACKEND_PID}" "${FRONTEND_PID}" 2>/dev/null || true
  wait || true
}
trap shutdown TERM INT

# If either service dies, tear the whole container down so the orchestrator restarts it.
wait -n "${BACKEND_PID}" "${FRONTEND_PID}"
echo "[entrypoint] A service exited unexpectedly; stopping container." >&2
shutdown
exit 1
