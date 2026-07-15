# One CRM — Deploy (single Docker image)

Frontend + backend in one image. Secrets only at runtime via env file.

## Quick start

```bash
cp Backend/.env.production.example prod.env   # fill DATABASE_URL, JWT_SECRET, etc.
ENV_FILE=./prod.env docker compose up -d --build
```

App: `http://<host>:<FRONTEND_PORT>` (default **3000**; use **3069** if set in `prod.env`).

Or without Compose:

```bash
docker build -t onecrm:latest .
docker run -d --name onecrm -p 3000:3000 --env-file prod.env onecrm:latest
```

Migrations run on boot (`prisma migrate deploy`). Set `RUN_MIGRATIONS=false` to skip.

## Notes

- Only the frontend port needs to be public; `/api` and `/uploads` proxy to the backend inside the container.
- Use S3 env vars for uploads in production (local disk is ephemeral).
- Bootstrap super admin once:  
  `SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=... node Backend/dist/scripts/bootstrap-super-admin.js`
