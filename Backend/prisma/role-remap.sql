-- ============================================================================
-- Role remap migration — run BEFORE `npx prisma db push`
-- ============================================================================
--
-- Why this exists:
--   Prisma cannot apply an enum change that removes a value still referenced by
--   any row in a column typed with that enum. The User.role column may still
--   contain 'IT', 'MARKETING', or 'AGENT' from the old role set. This script
--   remaps those rows to the new roles, and also removes the dropped roles from
--   the RolePermission table so they don't reappear in the editor.
--
-- Run order:
--   1) psql -d atcdev -f Backend/prisma/role-remap.sql
--      (or paste this into Prisma Studio's "raw query" tab)
--   2) npx prisma db push      (or `npx prisma migrate dev` once shadow DB is set up)
--   3) restart backend         (rbac will reseed defaults via ensureDefaults())
--
-- Idempotent: safe to re-run. If the old roles are already gone, the UPDATEs
-- simply touch zero rows.
-- ============================================================================

SET search_path TO onecrm;

-- 1) Remap existing User.role values from old enum to new enum.
--    IT, MARKETING, AGENT all need to be re-pointed before the enum loses them.
UPDATE "User" SET "role" = 'ADMIN'             WHERE "role" = 'IT';
UPDATE "User" SET "role" = 'MARKETING_MANAGER' WHERE "role" = 'MARKETING';
UPDATE "User" SET "role" = 'AGENCY_FREELANCER' WHERE "role" = 'AGENT';

-- 2) Drop the dropped roles from the live RolePermission map so the editor
--    UI doesn't display them. ensureDefaults() will seed the new roles on
--    next backend boot.
DELETE FROM "RolePermission" WHERE "role" IN ('IT', 'MARKETING', 'AGENT');

-- 3) (Optional) Sanity check after running:
-- SELECT "role", COUNT(*) FROM "User" GROUP BY "role";
-- SELECT "role" FROM "RolePermission" ORDER BY "role";
