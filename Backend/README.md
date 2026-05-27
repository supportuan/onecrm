# Backend — One CRM

A Node.js and PostgreSQL API backend for the One CRM application.

## Setup

1. Install dependencies from the repository root:

   ```bash
   npm install
   ```

2. Configure database connection in `Backend/.env`.

3. Create the PostgreSQL database and `customers` table.

4. Start the backend:
   ```bash
   npm run dev:backend
   ```

## PostgreSQL initialization

Use the SQL in `Backend/scripts/init-db.sql` to create a sample schema:

```sql
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT
);
```

## cat prisma/seed.ts
## npx prisma db seed