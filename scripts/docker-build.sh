#!/usr/bin/env bash
# Build the One CRM Docker image (frontend + backend in one container).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

IMAGE_NAME="${IMAGE_NAME:-onecrm}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
BACKEND_INTERNAL_URL="${BACKEND_INTERNAL_URL:-http://127.0.0.1:4000}"

log() { printf '\033[1;34m[docker:build]\033[0m %s\n' "$*"; }

log "Building ${IMAGE_NAME}:${IMAGE_TAG} ..."
docker build \
  --build-arg BACKEND_INTERNAL_URL="${BACKEND_INTERNAL_URL}" \
  -t "${IMAGE_NAME}:${IMAGE_TAG}" \
  -f Dockerfile \
  .

log "Done: ${IMAGE_NAME}:${IMAGE_TAG}"
