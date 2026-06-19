-- Per-tenant module enablement. A missing row means OFF.
-- For the existing "default" tenant we enable every catalog module so the
-- live behavior is unchanged after deploy.

SET search_path TO "onecrm", public;

CREATE TABLE "TenantModule" (
  "tenantId"  INTEGER NOT NULL,
  "moduleKey" TEXT    NOT NULL,
  "enabled"   BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantModule_pkey" PRIMARY KEY ("tenantId", "moduleKey")
);

CREATE INDEX "TenantModule_tenantId_idx" ON "TenantModule"("tenantId");

ALTER TABLE "TenantModule"
  ADD CONSTRAINT "TenantModule_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: enable every catalog module for the default tenant.
INSERT INTO "TenantModule" ("tenantId", "moduleKey", "enabled", "updatedAt")
SELECT t."id", m."key", true, CURRENT_TIMESTAMP
FROM "Tenant" t
CROSS JOIN (VALUES ('HR'), ('MARKETING'), ('STUDENT_CRM'), ('AGENCY_CRM'), ('ADMIN')) AS m("key")
WHERE t."slug" = 'default';
