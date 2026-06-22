-- Priority A: tighten leave + attendance multi-tenancy.
--   * HrAttendanceSetting: drop singleton id, key by tenantId
--   * HrAttendanceRecord, HrRegularization, HrLeaveRequest,
--     HrLeaveDefinition, HrLeavePlanAssignment: add tenantId + FK + index
--   * HrLeaveType.code: per-tenant unique
--   * HrProcessingMetric.period: per-tenant unique
--   * User.mustChangePassword

SET search_path TO "onecrm", public;

-- =====================================================
-- 1. User.mustChangePassword
-- =====================================================
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- =====================================================
-- 2. HrAttendanceSetting: singleton -> per-tenant
-- =====================================================
-- Capture current global settings (if any) before we restructure.
DO $$
DECLARE
  cur_mode  TEXT;
  cur_ipv   BOOLEAN;
  default_tid INTEGER;
BEGIN
  SELECT id INTO default_tid FROM "Tenant" WHERE slug = 'default';

  -- Grab existing singleton row if one exists (no ORDER BY: pre-migration
  -- the table only has the legacy id PK and no tenantId column).
  IF EXISTS (SELECT 1 FROM "HrAttendanceSetting") THEN
    SELECT "attendanceMode", "enableIpValidation"
      INTO cur_mode, cur_ipv
      FROM "HrAttendanceSetting"
      LIMIT 1;
  END IF;

  cur_mode := COALESCE(cur_mode, 'biometric');
  cur_ipv  := COALESCE(cur_ipv, true);

  -- Drop and recreate the table with the new shape.
  DROP TABLE IF EXISTS "HrAttendanceSetting" CASCADE;

  CREATE TABLE "HrAttendanceSetting" (
    "tenantId"           INTEGER PRIMARY KEY,
    "attendanceMode"     TEXT NOT NULL DEFAULT 'biometric',
    "enableIpValidation" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HrAttendanceSetting_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  );

  -- One row per existing tenant, carrying forward the old singleton values.
  INSERT INTO "HrAttendanceSetting" ("tenantId", "attendanceMode", "enableIpValidation", "updatedAt")
  SELECT t.id, cur_mode, cur_ipv, CURRENT_TIMESTAMP
  FROM "Tenant" t
  ON CONFLICT ("tenantId") DO NOTHING;
END $$;

-- =====================================================
-- 3. Add tenantId to leave/attendance child tables
--    Backfill from parent (employee or plan).
-- =====================================================

-- HrAttendanceRecord  (backfill from HrEmployee.tenantId)
ALTER TABLE "HrAttendanceRecord" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "HrAttendanceRecord" r
   SET "tenantId" = e."tenantId"
  FROM "HrEmployee" e
 WHERE r."employeeId" = e."id"
   AND r."tenantId" IS NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'HrAttendanceRecord_tenantId_fkey'
      AND conrelid = '"onecrm"."HrAttendanceRecord"'::regclass
  ) THEN
    ALTER TABLE "HrAttendanceRecord"
      ADD CONSTRAINT "HrAttendanceRecord_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "HrAttendanceRecord_tenantId_idx" ON "HrAttendanceRecord"("tenantId");

-- HrRegularization
ALTER TABLE "HrRegularization" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "HrRegularization" r
   SET "tenantId" = e."tenantId"
  FROM "HrEmployee" e
 WHERE r."employeeId" = e."id"
   AND r."tenantId" IS NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'HrRegularization_tenantId_fkey'
      AND conrelid = '"onecrm"."HrRegularization"'::regclass
  ) THEN
    ALTER TABLE "HrRegularization"
      ADD CONSTRAINT "HrRegularization_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "HrRegularization_tenantId_idx" ON "HrRegularization"("tenantId");

-- HrLeaveRequest
ALTER TABLE "HrLeaveRequest" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "HrLeaveRequest" r
   SET "tenantId" = e."tenantId"
  FROM "HrEmployee" e
 WHERE r."employeeId" = e."id"
   AND r."tenantId" IS NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'HrLeaveRequest_tenantId_fkey'
      AND conrelid = '"onecrm"."HrLeaveRequest"'::regclass
  ) THEN
    ALTER TABLE "HrLeaveRequest"
      ADD CONSTRAINT "HrLeaveRequest_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "HrLeaveRequest_tenantId_idx" ON "HrLeaveRequest"("tenantId");

-- HrLeaveDefinition  (backfill from HrLeavePlan.tenantId)
ALTER TABLE "HrLeaveDefinition" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "HrLeaveDefinition" d
   SET "tenantId" = p."tenantId"
  FROM "HrLeavePlan" p
 WHERE d."planId" = p."id"
   AND d."tenantId" IS NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'HrLeaveDefinition_tenantId_fkey'
      AND conrelid = '"onecrm"."HrLeaveDefinition"'::regclass
  ) THEN
    ALTER TABLE "HrLeaveDefinition"
      ADD CONSTRAINT "HrLeaveDefinition_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "HrLeaveDefinition_tenantId_idx" ON "HrLeaveDefinition"("tenantId");

-- HrLeavePlanAssignment  (backfill from HrLeavePlan.tenantId)
ALTER TABLE "HrLeavePlanAssignment" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "HrLeavePlanAssignment" a
   SET "tenantId" = p."tenantId"
  FROM "HrLeavePlan" p
 WHERE a."planId" = p."id"
   AND a."tenantId" IS NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'HrLeavePlanAssignment_tenantId_fkey'
      AND conrelid = '"onecrm"."HrLeavePlanAssignment"'::regclass
  ) THEN
    ALTER TABLE "HrLeavePlanAssignment"
      ADD CONSTRAINT "HrLeavePlanAssignment_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "HrLeavePlanAssignment_tenantId_idx" ON "HrLeavePlanAssignment"("tenantId");

-- =====================================================
-- 4. Replace global @unique with per-tenant composite
-- =====================================================

-- HrLeaveType.code
ALTER TABLE "HrLeaveType" DROP CONSTRAINT IF EXISTS "HrLeaveType_code_key";
DROP INDEX IF EXISTS "HrLeaveType_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "HrLeaveType_tenantId_code_key"
  ON "HrLeaveType"("tenantId", "code");

-- HrProcessingMetric.period
ALTER TABLE "HrProcessingMetric" DROP CONSTRAINT IF EXISTS "HrProcessingMetric_period_key";
DROP INDEX IF EXISTS "HrProcessingMetric_period_key";
CREATE UNIQUE INDEX IF NOT EXISTS "HrProcessingMetric_tenantId_period_key"
  ON "HrProcessingMetric"("tenantId", "period");
