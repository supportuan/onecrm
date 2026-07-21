SET search_path TO "onecrm", public;

ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

UPDATE "Campaign" c
SET "tenantId" = tenant_source."tenantId"
FROM (
  SELECT cl."campaignId", MIN(l."tenantId") AS "tenantId"
  FROM "CampaignLead" cl
  JOIN "Lead" l ON l.id = cl."leadId"
  WHERE l."tenantId" IS NOT NULL
  GROUP BY cl."campaignId"
) tenant_source
WHERE c.id = tenant_source."campaignId"
  AND c."tenantId" IS NULL;

UPDATE "Campaign"
SET "tenantId" = (SELECT id FROM "Tenant" ORDER BY id ASC LIMIT 1)
WHERE "tenantId" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Campaign_tenantId_fkey'
  ) THEN
    ALTER TABLE "Campaign"
      ADD CONSTRAINT "Campaign_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Campaign_tenantId_idx" ON "Campaign"("tenantId");
