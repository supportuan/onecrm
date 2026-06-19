-- Tenant foundation: Tenant table + tenantId on User & RolePermission.
-- Existing rows are backfilled to a single "default" tenant (slug = 'default').
-- SUPER_ADMIN users keep tenantId NULL (cross-tenant).

SET search_path TO "onecrm", public;

-- 1. Enum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- 2. Tenant table
CREATE TABLE "Tenant" (
  "id"        SERIAL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "status"    "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- 3. Seed the default tenant so we can backfill
INSERT INTO "Tenant" ("name", "slug", "updatedAt")
VALUES ('Default', 'default', CURRENT_TIMESTAMP);

-- 4. User.tenantId
ALTER TABLE "User" ADD COLUMN "tenantId" INTEGER;
UPDATE "User"
  SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'default')
  WHERE "role" <> 'SUPER_ADMIN';
ALTER TABLE "User"
  ADD CONSTRAINT "User_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- 5. RolePermission.tenantId (nullable; per-tenant scoping comes in Phase 2)
ALTER TABLE "RolePermission" ADD COLUMN "tenantId" INTEGER;
UPDATE "RolePermission"
  SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'default');
ALTER TABLE "RolePermission"
  ADD CONSTRAINT "RolePermission_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "RolePermission_tenantId_idx" ON "RolePermission"("tenantId");
