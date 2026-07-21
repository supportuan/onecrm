INSERT INTO "TenantModule" ("tenantId", "moduleKey", "enabled", "createdAt", "updatedAt")
SELECT "id", 'RESOURCES', true, NOW(), NOW()
FROM "Tenant"
ON CONFLICT ("tenantId", "moduleKey")
DO UPDATE SET
  "enabled" = true,
  "updatedAt" = NOW();
