# One CRM — Deploy (single Docker image, isolated copies)

Frontend + backend in one image. Secrets only at runtime via **that client's** env file.

One git repo. One image tag. **One database per client.** See **[deploy/CLIENTS.md](deploy/CLIENTS.md)** for the four-client checklist.

## Public URL (ApplyUniNow copy)

Production CRM: **[https://crm.applyuninow.com/login](https://crm.applyuninow.com/login)**

```bash
FRONTEND_URL=https://crm.applyuninow.com
ORG_NAME=ApplyUniNow
```

Other clients get their own hostname and `ORG_NAME`. All welcome emails, password resets, and student login links use that copy's `FRONTEND_URL`.

## Quick start (one copy)

```bash
cp Backend/.env.production.example deploy/clients/aun.env   # fill DATABASE_URL, JWT_SECRET, branding, etc.
docker compose --env-file deploy/compose/aun.env up -d --build
```

App: `http://<host>:<FRONTEND_PORT>` (ApplyUniNow compose file uses **3069**).

Or without Compose:

```bash
docker build -t onecrm:latest .
docker run -d --name onecrm-aun -p 3069:3069 --env-file deploy/clients/aun.env onecrm:latest
```

Migrations run on boot (`prisma migrate deploy`). Set `RUN_MIGRATIONS=false` to skip.

## Four clients on one host

Build once, run four Compose projects with different ports and env files:

```bash
docker build -t onecrm:latest .
docker compose --env-file deploy/compose/aun.env up -d
docker compose --env-file deploy/compose/client-b.env up -d
docker compose --env-file deploy/compose/client-c.env up -d
docker compose --env-file deploy/compose/client-d.env up -d
```

Each `deploy/compose/*.env` sets `COMPOSE_PROJECT_NAME`, `CONTAINER_NAME`, `ENV_FILE`, and ports so stacks do not overwrite each other.

## Nginx + HTTPS

ApplyUniNow (existing):

1. Point DNS **A record**: `crm.applyuninow.com` → your server IP.
2. Copy the site config:
   ```bash
   sudo cp deploy/nginx/crm.applyuninow.com.conf /etc/nginx/sites-available/
   sudo ln -sf /etc/nginx/sites-available/crm.applyuninow.com.conf /etc/nginx/sites-enabled/
   ```
3. Adjust `upstream onecrm_app` port if `FRONTEND_PORT` is not `3069`.
4. Issue SSL:
   ```bash
   sudo certbot --nginx -d crm.applyuninow.com
   sudo nginx -t && sudo systemctl reload nginx
   ```

Additional clients: copy `deploy/nginx/client.example.conf`, give each site **unique** upstream names, hostname, and ports.

The nginx config proxies:

- `/` → Next.js (frontend port)
- `/ws/` → backend (WebSocket for live chat)

## Notes

- Only the frontend port needs to be public; `/api` and `/uploads` proxy to the backend inside the container.
- Use S3 env vars for uploads in production (local disk is ephemeral). Use a **distinct** `AWS_S3_PREFIX` (or bucket) per client.
- Bootstrap super admin once **per copy**:  
  `SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=... node Backend/dist/scripts/bootstrap-super-admin.js`
- Login branding is `GET /api/org/branding` (unauthenticated). It is not a tenant switcher.
