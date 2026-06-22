-- Rename the tenant-scoped admin role: ADMIN -> GLOBAL_ADMIN.
-- The role concept is "admin with full access inside one tenant".
-- SUPER_ADMIN (cross-tenant) is untouched.
--
-- Postgres' ALTER TYPE RENAME VALUE updates every row using the enum
-- atomically in O(1), no rewrites required.

SET search_path TO "onecrm", public;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'ADMIN'
  ) THEN
    ALTER TYPE "UserRole" RENAME VALUE 'ADMIN' TO 'GLOBAL_ADMIN';
  END IF;
END $$;

-- RolePermission.role is a plain TEXT column (not the enum), so still holds
-- the legacy literal 'ADMIN'. Two cases to handle:
--   (a) The new GLOBAL_ADMIN row already exists for the tenant
--       (e.g. boot-time seedTenantDefaults wrote it). Drop the stale ADMIN
--       duplicate — the GLOBAL_ADMIN row is the canonical one going forward.
--   (b) No GLOBAL_ADMIN row yet → rename the ADMIN row in place.
DELETE FROM "RolePermission" a
USING "RolePermission" b
WHERE a."role" = 'ADMIN'
  AND b."role" = 'GLOBAL_ADMIN'
  AND a."tenantId" IS NOT DISTINCT FROM b."tenantId";

UPDATE "RolePermission" SET "role" = 'GLOBAL_ADMIN' WHERE "role" = 'ADMIN';
