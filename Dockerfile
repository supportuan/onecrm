# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# One CRM — single deployable image (frontend + backend, source-free runtime)
#
# The client receives ONLY this image. Source TypeScript/JSX never ships:
#   - Backend is compiled (tsc) to plain JS in dist/
#   - Frontend is built to a Next.js standalone server bundle
# All secrets (DB URL, JWT, AWS, SMTP, Meta) are injected at RUNTIME via env,
# never baked into the image.
# ---------------------------------------------------------------------------

ARG NODE_IMAGE=node:22-bookworm-slim

# ===========================================================================
# 1. Backend dependencies (+ Prisma client) — full deps for compiling
# ===========================================================================
FROM ${NODE_IMAGE} AS backend-deps
WORKDIR /app/Backend
# Toolchain for native modules (bcrypt, ssh2, cpu-features) + openssl for Prisma
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY Backend/package.json Backend/package-lock.json ./
RUN npm ci
COPY Backend/prisma ./prisma
RUN npx prisma generate

# ===========================================================================
# 2. Backend build — TypeScript -> dist/ (plain JS)
# ===========================================================================
FROM backend-deps AS backend-build
COPY Backend/tsconfig.json ./
COPY Backend/src ./src
RUN npm run build

# ===========================================================================
# 3. Frontend build — Next.js standalone output
# ===========================================================================
FROM ${NODE_IMAGE} AS frontend-build
WORKDIR /app/frontend-next
ENV NEXT_TELEMETRY_DISABLED=1
# Baked at build time into the route manifest; backend is co-located in-container.
ARG BACKEND_INTERNAL_URL=http://127.0.0.1:4000
ENV BACKEND_INTERNAL_URL=${BACKEND_INTERNAL_URL}
COPY frontend-next/package.json frontend-next/package-lock.json ./
RUN npm ci
COPY frontend-next/ ./
RUN npm run build

# ===========================================================================
# 4. Runtime — minimal, compiled artifacts only
# ===========================================================================
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# --- Backend: compiled JS + deps + prisma schema/migrations (no src) ---
COPY --from=backend-deps  /app/Backend/node_modules ./Backend/node_modules
COPY --from=backend-build /app/Backend/dist         ./Backend/dist
COPY --from=backend-build /app/Backend/prisma       ./Backend/prisma
COPY Backend/package.json ./Backend/package.json

# --- Frontend: Next.js standalone bundle (server.js + minimal node_modules) ---
COPY --from=frontend-build /app/frontend-next/.next/standalone ./frontend-next/
COPY --from=frontend-build /app/frontend-next/.next/static     ./frontend-next/.next/static
COPY --from=frontend-build /app/frontend-next/public           ./frontend-next/public

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Drop to non-root for runtime
RUN groupadd --system app && useradd --system --gid app --home /app app \
    && chown -R app:app /app
USER app

# 3000 = frontend (user-facing), 4000 = backend API (internal/optional)
EXPOSE 3000 4000

ENTRYPOINT ["tini", "--", "/usr/local/bin/entrypoint.sh"]
