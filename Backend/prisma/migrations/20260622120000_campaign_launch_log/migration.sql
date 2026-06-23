-- Add the CampaignLaunchLog table referenced by the marketing service.

SET search_path TO "onecrm", public;

CREATE TABLE IF NOT EXISTS "CampaignLaunchLog" (
  "id"         SERIAL PRIMARY KEY,
  "campaignId" INTEGER NOT NULL,
  "launchedBy" INTEGER,
  "status"     TEXT NOT NULL,
  "details"    JSONB,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "CampaignLaunchLog_campaignId_idx" ON "CampaignLaunchLog"("campaignId");
CREATE INDEX IF NOT EXISTS "CampaignLaunchLog_createdAt_idx" ON "CampaignLaunchLog"("createdAt");
