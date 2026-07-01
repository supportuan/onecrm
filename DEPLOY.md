# One CRM — Deployment (single Docker image)

The whole app (Next.js frontend + Express/Prisma backend) ships as **one image**.
The client only needs the image plus runtime environment variables — **no source code**.

## What's inside

- Backend compiled to plain JS (`Backend/dist`) — no TypeScript source.
- Frontend built as a Next.js **standalone** server bundle — no source/pages.
- Prisma schema + migrations (needed to run `migrate deploy` on boot).
- No secrets are baked in. Everything sensitive is passed at runtime.

Ports: **3000** = frontend (user-facing), **4000** = backend API (internal; expose only if needed).

## 1. Build the image

```bash
docker build -t onecrm:latest .
```

To export it for a client who shouldn't get the repo:

```bash
docker save onecrm:latest | gzip > onecrm-latest.tar.gz
# Client side:
docker load < onecrm-latest.tar.gz
```

## 2. Provide runtime config

Copy the template and fill in real values (keep this file private, never commit it):

```bash
cp Backend/.env.production.example prod.env
# edit prod.env
```

Minimum required: `DATABASE_URL` and `JWT_SECRET`.

> **DATABASE_URL format:** Prisma uses a URL, not JDBC. Convert
> `jdbc:postgresql://HOST:5432/postgres` →
> `postgresql://USER:PASSWORD@HOST:5432/postgres`.
> URL-encode special characters in the password (e.g. `#` → `%23`).
> Add `?sslmode=require` if the RDS instance enforces SSL.

## 3. Run

```bash
docker run -d --name onecrm \
  -p 3000:3000 \
  --env-file prod.env \
  onecrm:latest
```

Migrations run automatically on startup (`prisma migrate deploy`). Disable with
`RUN_MIGRATIONS=false` in `prod.env` if you manage migrations separately.

App is then available at `http://<host>:3000`.

## Notes

- The frontend proxies `/api/*` and `/uploads/*` to the backend inside the
  container (`127.0.0.1:4000`), so only port 3000 must be exposed publicly.
- File uploads use S3 when AWS keys are provided; otherwise they fall back to
  the container's local disk (ephemeral — set S3 for production).
- To seed an initial super admin, run once against the prod DB:
  `SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=... node Backend/dist/scripts/bootstrap-super-admin.js`
  (or exec into the container).
