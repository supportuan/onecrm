#!/usr/bin/env bash
# Run frontend + backend together for local development.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BACKEND_ENV="$ROOT/Backend/.env"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-4000}"

log() { printf '\033[1;34m[dev]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[dev]\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31m[dev]\033[0m %s\n' "$*" >&2; exit 1; }

if ! command -v node >/dev/null 2>&1; then
  die "Node.js is required. Install Node 22+ and retry."
fi

if [[ ! -f "$BACKEND_ENV" ]]; then
  die "Missing Backend/.env — copy Backend/.env.production.example and fill in your values."
fi

if [[ ! -d "$ROOT/Backend/node_modules" ]]; then
  log "Installing backend dependencies..."
  npm ci --prefix "$ROOT/Backend"
fi

if [[ ! -d "$ROOT/frontend-next/node_modules" ]]; then
  log "Installing frontend dependencies..."
  npm ci --prefix "$ROOT/frontend-next"
fi

if [[ ! -d "$ROOT/node_modules" ]]; then
  log "Installing root dev dependencies (concurrently)..."
  npm ci
fi

export BACKEND_INTERNAL_URL="http://127.0.0.1:${BACKEND_PORT}"

log "Starting One CRM (backend :${BACKEND_PORT}, frontend :${FRONTEND_PORT})"
log "  App:     http://localhost:${FRONTEND_PORT}"
log "  API:     http://localhost:${BACKEND_PORT}/api"
log "  Swagger: http://localhost:${BACKEND_PORT}/api-docs"
log "Press Ctrl+C to stop both services."

exec npm run dev
