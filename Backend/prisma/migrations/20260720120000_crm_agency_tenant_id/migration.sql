-- Add tenant isolation columns for CRM / Agency models
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
ALTER TABLE "AgencyPartner" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

DO $$ BEGIN
  ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Student" ADD CONSTRAINT "Student_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Application" ADD CONSTRAINT "Application_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "AgencyPartner" ADD CONSTRAINT "AgencyPartner_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "Lead_tenantId_idx" ON "Lead"("tenantId");
CREATE INDEX IF NOT EXISTS "Student_tenantId_idx" ON "Student"("tenantId");
CREATE INDEX IF NOT EXISTS "Application_tenantId_idx" ON "Application"("tenantId");
CREATE INDEX IF NOT EXISTS "AgencyPartner_tenantId_idx" ON "AgencyPartner"("tenantId");

-- Backfill from related users where possible
UPDATE "AgencyPartner" ap
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE ap."userId" = u.id AND ap."tenantId" IS NULL AND u."tenantId" IS NOT NULL;

UPDATE "Student" s
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE s."userId" = u.id AND s."tenantId" IS NULL AND u."tenantId" IS NOT NULL;

UPDATE "Student" s
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE s."contactId" = u.id AND s."tenantId" IS NULL AND u."tenantId" IS NOT NULL;

UPDATE "Application" a
SET "tenantId" = s."tenantId"
FROM "Student" s
WHERE a."studentId" = s.id AND a."tenantId" IS NULL AND s."tenantId" IS NOT NULL;

UPDATE "Lead" l
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE l."assignedCounsellorId" = u.id AND l."tenantId" IS NULL AND u."tenantId" IS NOT NULL;

-- Fallback: default tenant for remaining CRM rows
UPDATE "Lead" SET "tenantId" = (SELECT id FROM "Tenant" ORDER BY id ASC LIMIT 1) WHERE "tenantId" IS NULL;
UPDATE "Student" SET "tenantId" = (SELECT id FROM "Tenant" ORDER BY id ASC LIMIT 1) WHERE "tenantId" IS NULL;
UPDATE "Application" SET "tenantId" = (SELECT id FROM "Tenant" ORDER BY id ASC LIMIT 1) WHERE "tenantId" IS NULL;
UPDATE "AgencyPartner" SET "tenantId" = (SELECT id FROM "Tenant" ORDER BY id ASC LIMIT 1) WHERE "tenantId" IS NULL;
