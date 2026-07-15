# One CRM — single image (Next.js frontend + Express backend). Secrets via env at runtime.
ARG NODE_IMAGE=node:22-bookworm-slim

# ---------------------------------------------------------------------------
# Backend: install, compile, then drop devDependencies
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS backend-build
WORKDIR /app/Backend
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY Backend/package.json Backend/package-lock.json ./
COPY Backend/prisma ./prisma
RUN npm ci
COPY Backend/tsconfig.json ./
COPY Backend/src ./src
RUN npm run build && npm prune --omit=dev

# ---------------------------------------------------------------------------
# Frontend: Next.js standalone
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS frontend-build
WORKDIR /app/frontend-next
ENV NEXT_TELEMETRY_DISABLED=1
ARG BACKEND_INTERNAL_URL=http://127.0.0.1:4000
ENV BACKEND_INTERNAL_URL=${BACKEND_INTERNAL_URL}
COPY frontend-next/package.json frontend-next/package-lock.json ./
RUN npm ci
COPY frontend-next/ ./
RUN npm run build

# ---------------------------------------------------------------------------
# Runtime
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=backend-build /app/Backend/node_modules ./Backend/node_modules
COPY --from=backend-build /app/Backend/dist         ./Backend/dist
COPY --from=backend-build /app/Backend/prisma       ./Backend/prisma
COPY Backend/package.json ./Backend/package.json

COPY --from=frontend-build /app/frontend-next/.next/standalone ./frontend-next/
COPY --from=frontend-build /app/frontend-next/.next/static     ./frontend-next/.next/static
COPY --from=frontend-build /app/frontend-next/public           ./frontend-next/public

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh \
    && groupadd --system app && useradd --system --gid app --home /app app \
    && chown -R app:app /app
USER app

EXPOSE 3000
ENTRYPOINT ["tini", "--", "/usr/local/bin/entrypoint.sh"]
