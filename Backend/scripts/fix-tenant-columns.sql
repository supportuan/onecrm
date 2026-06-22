-- Idempotent corrective SQL: ensures the multi-tenant columns exist on the
-- onecrm-schema tables. Safe to run multiple times.

SET search_path TO "onecrm", public;

-- 1. Tenant table + enum (in case the foundation migration didn't actually run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TenantStatus') THEN
    CREATE TYPE "onecrm"."TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "onecrm"."Tenant" (
  "id"        SERIAL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "status"    "onecrm"."TenantStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_slug_key" ON "onecrm"."Tenant"("slug");

INSERT INTO "onecrm"."Tenant" ("name", "slug", "updatedAt")
SELECT 'Default', 'default', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "onecrm"."Tenant" WHERE "slug" = 'default');

-- 2. User.tenantId
ALTER TABLE "onecrm"."User" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "onecrm"."User"
   SET "tenantId" = (SELECT id FROM "onecrm"."Tenant" WHERE slug = 'default')
 WHERE "tenantId" IS NULL AND "role" <> 'SUPER_ADMIN';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'User_tenantId_fkey'
      AND conrelid = '"onecrm"."User"'::regclass
  ) THEN
    ALTER TABLE "onecrm"."User"
      ADD CONSTRAINT "User_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "onecrm"."Tenant"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "onecrm"."User"("tenantId");

-- 3. RolePermission.tenantId
ALTER TABLE "onecrm"."RolePermission" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "onecrm"."RolePermission"
   SET "tenantId" = (SELECT id FROM "onecrm"."Tenant" WHERE slug = 'default')
 WHERE "tenantId" IS NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'RolePermission_tenantId_fkey'
      AND conrelid = '"onecrm"."RolePermission"'::regclass
  ) THEN
    ALTER TABLE "onecrm"."RolePermission"
      ADD CONSTRAINT "RolePermission_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "onecrm"."Tenant"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "RolePermission_tenantId_idx" ON "onecrm"."RolePermission"("tenantId");

-- 4. TenantModule table
CREATE TABLE IF NOT EXISTS "onecrm"."TenantModule" (
  "tenantId"  INTEGER NOT NULL,
  "moduleKey" TEXT    NOT NULL,
  "enabled"   BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantModule_pkey" PRIMARY KEY ("tenantId", "moduleKey")
);
CREATE INDEX IF NOT EXISTS "TenantModule_tenantId_idx" ON "onecrm"."TenantModule"("tenantId");
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TenantModule_tenantId_fkey'
      AND conrelid = '"onecrm"."TenantModule"'::regclass
  ) THEN
    ALTER TABLE "onecrm"."TenantModule"
      ADD CONSTRAINT "TenantModule_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "onecrm"."Tenant"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Enable every catalog module for the default tenant (only inserts missing rows)
INSERT INTO "onecrm"."TenantModule" ("tenantId", "moduleKey", "enabled", "updatedAt")
SELECT t.id, m.key, true, CURRENT_TIMESTAMP
FROM "onecrm"."Tenant" t
CROSS JOIN (VALUES ('HR'), ('MARKETING'), ('STUDENT_CRM'), ('AGENCY_CRM'), ('ADMIN')) AS m(key)
WHERE t.slug = 'default'
ON CONFLICT ("tenantId", "moduleKey") DO NOTHING;

-- 5. HR root tables — add tenantId if missing, backfill, FK, index
DO $$
DECLARE
  tbl TEXT;
  default_id INTEGER;
BEGIN
  SELECT id INTO default_id FROM "onecrm"."Tenant" WHERE slug = 'default';

  FOR tbl IN
    SELECT unnest(ARRAY[
      'HrEmployee', 'HrAttendanceDevice', 'HrNetworkWhitelist',
      'HrLeavePlan', 'HrLeaveType', 'HrHoliday', 'HrJobPosting',
      'HrKpiDefinition', 'HrProcessingMetric', 'HrMarketingPerformance',
      'HrCounsellorPerformance', 'HrPerformanceReview'
    ])
  LOOP
    -- Skip if the table doesn't exist (e.g. fresh DB without HR)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'onecrm' AND table_name = tbl
    ) THEN
      CONTINUE;
    END IF;

    -- Add column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'onecrm' AND table_name = tbl AND column_name = 'tenantId'
    ) THEN
      EXECUTE format('ALTER TABLE %I.%I ADD COLUMN "tenantId" INTEGER', 'onecrm', tbl);
      EXECUTE format('UPDATE %I.%I SET "tenantId" = $1', 'onecrm', tbl) USING default_id;
      EXECUTE format(
        'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY ("tenantId") REFERENCES "onecrm"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE',
        'onecrm', tbl, tbl || '_tenantId_fkey'
      );
      EXECUTE format(
        'CREATE INDEX %I ON %I.%I("tenantId")',
        tbl || '_tenantId_idx', 'onecrm', tbl
      );
    END IF;
  END LOOP;
END $$;
