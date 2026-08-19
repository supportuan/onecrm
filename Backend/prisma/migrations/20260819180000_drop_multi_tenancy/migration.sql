-- Collapse ApplyUniNow to a single organization: drop Tenant / TenantModule /
-- SuperAdminAudit and every tenantId column. Existing rows are kept; duplicate
-- unique keys that were per-tenant are merged.

-- Branding singleton, copied from the ApplyUniNow / default tenant when present.
CREATE TABLE IF NOT EXISTS "OrgSettings" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'ApplyUniNow',
    "logoUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "OrgSettings" ("id", "name", "logoUrl", "updatedAt")
SELECT
    1,
    COALESCE(
        (
            SELECT t."name"
            FROM "Tenant" t
            WHERE t."slug" = 'default' OR t."name" ILIKE 'ApplyUniNow'
            ORDER BY t."id"
            LIMIT 1
        ),
        (SELECT t."name" FROM "Tenant" t ORDER BY t."id" LIMIT 1),
        'ApplyUniNow'
    ),
    COALESCE(
        (
            SELECT t."logoUrl"
            FROM "Tenant" t
            WHERE t."slug" = 'default' OR t."name" ILIKE 'ApplyUniNow'
            ORDER BY t."id"
            LIMIT 1
        ),
        (SELECT t."logoUrl" FROM "Tenant" t ORDER BY t."id" LIMIT 1)
    ),
    CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'Tenant')
  AND NOT EXISTS (SELECT 1 FROM "OrgSettings" WHERE "id" = 1);

INSERT INTO "OrgSettings" ("id", "name", "logoUrl", "updatedAt")
SELECT 1, 'ApplyUniNow', NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "OrgSettings" WHERE "id" = 1);

-- RolePermission: one row per role.
DELETE FROM "RolePermission" a
USING "RolePermission" b
WHERE a."role" = b."role" AND a."id" > b."id";

-- Leave types: remap definitions onto the kept row, then drop duplicates.
UPDATE "HrLeaveDefinition" d
SET "leaveTypeId" = kept.keep_id
FROM "HrLeaveType" t
JOIN (
    SELECT "code", MIN("id") AS keep_id
    FROM "HrLeaveType"
    GROUP BY "code"
) kept ON kept."code" = t."code"
WHERE d."leaveTypeId" = t."id" AND t."id" <> kept.keep_id;

DELETE FROM "HrLeaveType" t
WHERE t."id" NOT IN (
    SELECT MIN("id") FROM "HrLeaveType" GROUP BY "code"
);

-- Processing metrics: one row per period.
DELETE FROM "HrProcessingMetric" a
USING "HrProcessingMetric" b
WHERE a."period" = b."period" AND a."id" > b."id";

-- Attendance settings: keep one row and switch PK from tenantId to serial id.
DELETE FROM "HrAttendanceSetting" a
USING "HrAttendanceSetting" b
WHERE a.ctid > b.ctid;

ALTER TABLE "HrAttendanceSetting" ADD COLUMN IF NOT EXISTS "id" INTEGER;
CREATE SEQUENCE IF NOT EXISTS "HrAttendanceSetting_id_seq";
UPDATE "HrAttendanceSetting" SET "id" = nextval('"HrAttendanceSetting_id_seq"') WHERE "id" IS NULL;
ALTER TABLE "HrAttendanceSetting" ALTER COLUMN "id" SET DEFAULT nextval('"HrAttendanceSetting_id_seq"');
ALTER SEQUENCE "HrAttendanceSetting_id_seq" OWNED BY "HrAttendanceSetting"."id";
ALTER TABLE "HrAttendanceSetting" DROP CONSTRAINT IF EXISTS "HrAttendanceSetting_pkey";
ALTER TABLE "HrAttendanceSetting" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "HrAttendanceSetting" ADD PRIMARY KEY ("id");
SELECT setval(
    '"HrAttendanceSetting_id_seq"',
    GREATEST(COALESCE((SELECT MAX("id") FROM "HrAttendanceSetting"), 1), 1)
);

DROP TABLE IF EXISTS "SuperAdminAudit";
DROP TABLE IF EXISTS "TenantModule";

-- Drop every remaining tenantId column (indexes and FKs go with CASCADE).
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT c.table_name
        FROM information_schema.columns c
        WHERE c.table_schema = current_schema()
          AND c.column_name = 'tenantId'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP COLUMN IF EXISTS "tenantId" CASCADE', current_schema(), r.table_name);
    END LOOP;
END $$;

DROP TABLE IF EXISTS "Tenant";
DROP TYPE IF EXISTS "TenantStatus";

CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_role_key" ON "RolePermission"("role");
CREATE UNIQUE INDEX IF NOT EXISTS "HrLeaveType_code_key" ON "HrLeaveType"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "HrProcessingMetric_period_key" ON "HrProcessingMetric"("period");
CREATE INDEX IF NOT EXISTS "Resource_deletedAt_idx" ON "Resource"("deletedAt");
CREATE INDEX IF NOT EXISTS "ApplicationWorkflowTemplate_countryId_isActive_idx" ON "ApplicationWorkflowTemplate"("countryId", "isActive");
