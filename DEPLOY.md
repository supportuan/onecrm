# One CRM — Deploy (single Docker image)

Frontend + backend in one image. Secrets only at runtime via env file.

## Public URL

Production CRM: **[https://crm.applyuninow.com/login](https://crm.applyuninow.com/login)**

Set in your runtime env:

```bash
FRONTEND_URL=https://crm.applyuninow.com
```

All welcome emails, password resets, and student login links use this origin.

## Quick start

```bash
cp Backend/.env.production.example prod.env   # fill DATABASE_URL, JWT_SECRET, FRONTEND_URL, etc.
ENV_FILE=./prod.env docker compose up -d --build
```

App: `http://<host>:<FRONTEND_PORT>` (default **3000**; use **3069** if set in `prod.env`).

Or without Compose:

```bash
docker build -t onecrm:latest .
docker run -d --name onecrm -p 3069:3069 --env-file prod.env onecrm:latest
```

Migrations run on boot (`prisma migrate deploy`). Set `RUN_MIGRATIONS=false` to skip.

## Nginx + HTTPS (recommended)

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

The nginx config proxies:
- `/` → Next.js (frontend port)
- `/ws/` → backend (WebSocket for live chat)

## Notes

- Only the frontend port needs to be public; `/api` and `/uploads` proxy to the backend inside the container.
- Use S3 env vars for uploads in production (local disk is ephemeral).
- Bootstrap super admin once:  
  `SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=... node Backend/dist/scripts/bootstrap-super-admin.js`
