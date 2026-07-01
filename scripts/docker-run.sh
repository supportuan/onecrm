#!/usr/bin/env bash
# Build (optional) and run One CRM in Docker.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

IMAGE_NAME="${IMAGE_NAME:-onecrm}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CONTAINER_NAME="${CONTAINER_NAME:-onecrm}"
ENV_FILE="${ENV_FILE:-$ROOT/Backend/.env}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-4000}"
BUILD="${BUILD:-true}"

log() { printf '\033[1;34m[docker:run]\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m[docker:run]\033[0m %s\n' "$*" >&2; exit 1; }

[[ -f "$ENV_FILE" ]] || die "Env file not found: $ENV_FILE (set ENV_FILE=path/to/prod.env)"

if [[ "$BUILD" == "true" ]]; then
  IMAGE_NAME="$IMAGE_NAME" IMAGE_TAG="$IMAGE_TAG" "$ROOT/scripts/docker-build.sh"
fi

if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  log "Removing existing container: $CONTAINER_NAME"
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

log "Starting container $CONTAINER_NAME ..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --env-file "$ENV_FILE" \
  -e BACKEND_PORT="$BACKEND_PORT" \
  -e FRONTEND_PORT="$FRONTEND_PORT" \
  -p "${FRONTEND_PORT}:${FRONTEND_PORT}" \
  -p "${BACKEND_PORT}:${BACKEND_PORT}" \
  --restart unless-stopped \
  "${IMAGE_NAME}:${IMAGE_TAG}"

log "One CRM is running in Docker"
log "  App:     http://localhost:${FRONTEND_PORT}"
log "  API:     http://localhost:${BACKEND_PORT}/api"
log "  Logs:    docker logs -f $CONTAINER_NAME"
log "  Stop:    docker stop $CONTAINER_NAME"
