-- Repair null tenantIds on CRM rows created before tenant middleware was wired.
-- Prefer related user/lead tenant, then default slug, then first tenant.

UPDATE "Student" s
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE s."userId" = u.id
  AND s."tenantId" IS NULL
  AND u."tenantId" IS NOT NULL;

UPDATE "Student" s
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE s."contactId" = u.id
  AND s."tenantId" IS NULL
  AND u."tenantId" IS NOT NULL;

UPDATE "Student" s
SET "tenantId" = l."tenantId"
FROM "Lead" l
WHERE s."sourceLeadId" = l.id
  AND s."tenantId" IS NULL
  AND l."tenantId" IS NOT NULL;

UPDATE "Lead" l
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE l."assignedCounsellorId" = u.id
  AND l."tenantId" IS NULL
  AND u."tenantId" IS NOT NULL;

UPDATE "Lead" l
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE l."studentUserId" = u.id
  AND l."tenantId" IS NULL
  AND u."tenantId" IS NOT NULL;

UPDATE "Application" a
SET "tenantId" = s."tenantId"
FROM "Student" s
WHERE a."studentId" = s.id
  AND a."tenantId" IS NULL
  AND s."tenantId" IS NOT NULL;

UPDATE "Lead"
SET "tenantId" = COALESCE(
  (SELECT id FROM "Tenant" WHERE slug = 'default' AND status = 'ACTIVE' LIMIT 1),
  (SELECT id FROM "Tenant" WHERE status = 'ACTIVE' ORDER BY id ASC LIMIT 1)
)
WHERE "tenantId" IS NULL;

UPDATE "Student"
SET "tenantId" = COALESCE(
  (SELECT id FROM "Tenant" WHERE slug = 'default' AND status = 'ACTIVE' LIMIT 1),
  (SELECT id FROM "Tenant" WHERE status = 'ACTIVE' ORDER BY id ASC LIMIT 1)
)
WHERE "tenantId" IS NULL;

UPDATE "Application"
SET "tenantId" = COALESCE(
  (SELECT id FROM "Tenant" WHERE slug = 'default' AND status = 'ACTIVE' LIMIT 1),
  (SELECT id FROM "Tenant" WHERE status = 'ACTIVE' ORDER BY id ASC LIMIT 1)
)
WHERE "tenantId" IS NULL;
