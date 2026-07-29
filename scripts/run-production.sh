#!/usr/bin/env bash
# Build and run frontend + backend on a bare-metal server (no Docker).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BACKEND_ENV="$ROOT/Backend/.env"
BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-true}"

log() { printf '\033[1;34m[prod]\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m[prod]\033[0m %s\n' "$*" >&2; exit 1; }

[[ -f "$BACKEND_ENV" ]] || die "Missing Backend/.env"

export NODE_ENV=production
export BACKEND_INTERNAL_URL="http://127.0.0.1:${BACKEND_PORT}"
export PORT="$BACKEND_PORT"

log "Installing dependencies..."
npm ci --prefix "$ROOT/Backend"
npm ci --prefix "$ROOT/frontend-next"

log "Generating Prisma client..."
npm exec --prefix "$ROOT/Backend" prisma generate

if [[ "$RUN_MIGRATIONS" == "true" ]]; then
  log "Applying database migrations..."
  npm exec --prefix "$ROOT/Backend" prisma migrate deploy
fi

log "Building backend..."
npm run build --prefix "$ROOT/Backend"

log "Building frontend..."
npm run build --prefix "$ROOT/frontend-next"

STANDALONE_DIR="$ROOT/frontend-next/.next/standalone"
[[ -f "$STANDALONE_DIR/server.js" ]] || die "Frontend standalone build missing at $STANDALONE_DIR/server.js"

mkdir -p "$STANDALONE_DIR/.next/static"
cp -r "$ROOT/frontend-next/.next/static/." "$STANDALONE_DIR/.next/static/"
cp -r "$ROOT/frontend-next/public" "$STANDALONE_DIR/public"

BACKEND_PID=""
NEXT_PID=""
EDGE_PID=""

shutdown() {
  log "Shutting down..."
  [[ -n "$BACKEND_PID" ]] && kill -TERM "$BACKEND_PID" 2>/dev/null || true
  [[ -n "$NEXT_PID" ]] && kill -TERM "$NEXT_PID" 2>/dev/null || true
  [[ -n "$EDGE_PID" ]] && kill -TERM "$EDGE_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap shutdown TERM INT EXIT

log "Starting backend on :${BACKEND_PORT}..."
PORT="$BACKEND_PORT" node "$ROOT/Backend/dist/index.js" &
BACKEND_PID=$!

NEXT_INTERNAL_PORT="${NEXT_INTERNAL_PORT:-3001}"

log "Starting Next.js on internal :${NEXT_INTERNAL_PORT}..."
cd "$STANDALONE_DIR"
PORT="$NEXT_INTERNAL_PORT" HOSTNAME="127.0.0.1" node server.js &
NEXT_PID=$!

log "Starting edge proxy on :${FRONTEND_PORT} (WS /ws/* → backend)..."
export NEXT_INTERNAL_URL="http://127.0.0.1:${NEXT_INTERNAL_PORT}"
export BACKEND_INTERNAL_URL="http://127.0.0.1:${BACKEND_PORT}"
PORT="$FRONTEND_PORT" node "$ROOT/frontend-next/edge-proxy.mjs" &
EDGE_PID=$!

log "One CRM is running"
log "  App: http://0.0.0.0:${FRONTEND_PORT}"
log "  API: proxied via Next → http://127.0.0.1:${BACKEND_PORT}/api"

wait -n "$BACKEND_PID" "$NEXT_PID" "$EDGE_PID"
die "A service exited unexpectedly."
