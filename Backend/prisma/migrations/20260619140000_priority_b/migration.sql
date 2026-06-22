-- Priority B foundation:
--   * RolePermission: drop global unique(role), add unique(tenantId, role)
--   * SuperAdminAudit table

SET search_path TO "onecrm", public;

-- =====================================================
-- 1. RolePermission per-tenant uniqueness
-- =====================================================
ALTER TABLE "RolePermission" DROP CONSTRAINT IF EXISTS "RolePermission_role_key";
DROP INDEX IF EXISTS "RolePermission_role_key";

-- Dedup any rows with the same (tenantId, role) that may have accumulated
-- during earlier migrations. Keep the lowest id.
DELETE FROM "RolePermission" a
USING "RolePermission" b
WHERE a.id > b.id
  AND a."tenantId" IS NOT DISTINCT FROM b."tenantId"
  AND a."role" = b."role";

CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_tenantId_role_key"
  ON "RolePermission"("tenantId", "role");

-- =====================================================
-- 2. SuperAdminAudit
-- =====================================================
CREATE TABLE IF NOT EXISTS "SuperAdminAudit" (
  "id"             SERIAL PRIMARY KEY,
  "actorId"        INTEGER NOT NULL,
  "action"         TEXT NOT NULL,
  "targetTenantId" INTEGER,
  "payload"        JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'SuperAdminAudit_targetTenantId_fkey'
      AND conrelid = '"onecrm"."SuperAdminAudit"'::regclass
  ) THEN
    ALTER TABLE "SuperAdminAudit"
      ADD CONSTRAINT "SuperAdminAudit_targetTenantId_fkey"
      FOREIGN KEY ("targetTenantId") REFERENCES "Tenant"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "SuperAdminAudit_actorId_idx"       ON "SuperAdminAudit"("actorId");
CREATE INDEX IF NOT EXISTS "SuperAdminAudit_targetTenantId_idx" ON "SuperAdminAudit"("targetTenantId");
CREATE INDEX IF NOT EXISTS "SuperAdminAudit_action_idx"        ON "SuperAdminAudit"("action");
CREATE INDEX IF NOT EXISTS "SuperAdminAudit_createdAt_idx"     ON "SuperAdminAudit"("createdAt");
