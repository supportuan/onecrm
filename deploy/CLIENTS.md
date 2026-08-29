# One codebase, four isolated copies

Do not fork the repo. Do not bring `tenantId` back. Ship the **same Docker image** four times, each with its **own database and secrets**.

| Client | Compose project | App env file | Example domain |
|---|---|---|---|
| ApplyUniNow | `onecrm-aun` | `deploy/clients/aun.env` | crm.applyuninow.com |
| Client B | `onecrm-b` | `deploy/clients/client-b.env` | crm.client-b.example |
| Client C | `onecrm-c` | `deploy/clients/client-c.env` | crm.client-c.example |
| Client D | `onecrm-d` | `deploy/clients/client-d.env` | crm.client-d.example |

```bash
docker build -t onecrm:latest .
docker compose --env-file deploy/compose/aun.env up -d
docker compose --env-file deploy/compose/client-b.env up -d
# …repeat for C and D
```

Filled `*.env` files stay on the server. Never commit them.

## Data isolation (must not share)

Each copy is a separate product install. **Never** point two clients at the same value for:

- [ ] `DATABASE_URL` — own Postgres database (own RDS instance preferred)
- [ ] `JWT_SECRET` — new random secret per copy (old tokens must not work elsewhere)
- [ ] `AWS_S3_BUCKET` and/or `AWS_S3_PREFIX` — files must not collide
- [ ] SMTP (`SMTP_USER` / `EMAIL_FROM`) — mail from that client's brand
- [ ] Meta / Twilio / Razorpay / Google Ads keys
- [ ] `FRONTEND_URL` — that client's public hostname
- [ ] `ADMIN_NOTIFICATION_EMAIL` — do not leave another client's inbox here
- [ ] Bootstrap superadmin (`SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`) — created **inside that database**

Also:

- [ ] Do **not** restore Client A's dump into Client B's database
- [ ] Do **not** copy `uploads/` disks between clients
- [ ] Do **not** share Redis/session stores if you add them later
- [ ] Nginx `server_name` and upstream ports are unique per copy
- [ ] `COMPOSE_PROJECT_NAME` and `CONTAINER_NAME` are unique so stacks do not clobber each other

## Branding pack (login + emails)

Set these in that client's env file. The login page reads `GET /api/org/branding` (no auth).

- [ ] `ORG_NAME` — company name on login, emails, receipts
- [ ] `ORG_TAGLINE`
- [ ] `ORG_LOGO_URL` — absolute URL or `/images/...` path
- [ ] `ORG_WEBSITE_URL`
- [ ] `LOGIN_HEADLINE`
- [ ] `LOGIN_THEME` — `brand` | `aurora` | `mist`
- [ ] `LOGIN_THEME_LOCKED=true` if users must not switch themes
- [ ] `SHOW_ALLIED_SERVICES=true` only for ApplyUniNow (sister-brand page)
- [ ] `SHOW_SAMPLE_MODULES=true` only for ApplyUniNow (placeholder nav: Operations, Finance, Inventory, …)
- [ ] `ENABLED_MODULES` if this copy should hide live modules (e.g. `HR,MARKETING,ADMIN`)
- [ ] `EMAIL_FROM` display name matches `ORG_NAME`

After boot, open that client's `/login` and confirm name, logo, theme, and that a test user from another copy **cannot** sign in.

## Per-copy launch checklist

1. [ ] Create empty Postgres database (never clone another client)
2. [ ] Copy `deploy/clients/_template.env` → `deploy/clients/<slug>.env` and fill secrets
3. [ ] Copy `deploy/compose/_template.env` → `deploy/compose/<slug>.env` (ports + `ENV_FILE` path)
4. [ ] Copy `deploy/nginx/client.example.conf`, replace hostname + ports + upstream names
5. [ ] `docker compose --env-file deploy/compose/<slug>.env up -d`
6. [ ] `prisma migrate deploy` runs on boot (`RUN_MIGRATIONS=true`)
7. [ ] Bootstrap superadmin **in this copy only**
8. [ ] DNS A record → this host; certbot for this hostname
9. [ ] Send a test password-reset email; confirm From name and links use this `FRONTEND_URL`
10. [ ] Confirm S3 objects land under this prefix/bucket
11. [ ] Confirm login branding and that Allied Services is correct for this client

## Ports on one host

If all four stacks share a machine, give each copy its own published ports (see `deploy/compose/*.env`). Nginx proxies 443 → that copy's `FRONTEND_PORT`.
