SET search_path TO "onecrm", public;

ALTER TABLE "Campaign"
  ADD COLUMN IF NOT EXISTS "revenueGenerated" DOUBLE PRECISION NOT NULL DEFAULT 0;
