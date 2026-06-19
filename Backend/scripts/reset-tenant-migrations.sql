-- Remove the fake-applied tenant migration records so Prisma re-runs them.
-- Safe: these migrations never actually ran (the Tenant table doesn't exist).
SET search_path TO "onecrm", public;

DELETE FROM "_prisma_migrations"
WHERE migration_name IN (
  '20260616120000_tenant_foundation',
  '20260616130000_tenant_modules'
);
