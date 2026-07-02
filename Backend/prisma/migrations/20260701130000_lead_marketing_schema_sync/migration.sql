-- Sync Lead + Campaign columns required by marketing module (status timestamps, rating, Meta fields).
-- Safe to re-run: uses IF NOT EXISTS / IF EXISTS guards.

SET search_path TO "onecrm", public;

-- =====================================================
-- 1. LeadRating enum
-- =====================================================
DO $$
BEGIN
  CREATE TYPE "LeadRating" AS ENUM ('HOT', 'WARM', 'COLD', 'MAYBE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. Lead — status timestamps + marketing fields
-- =====================================================
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "contactedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "qualifiedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "proposedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "convertedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lostAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "assignedById" INTEGER;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "studentUserId" INTEGER;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "isStudentLoginCreated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "externalCampaignId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "platform" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "launchDetails" JSONB;

-- rating replaces legacy score column
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "rating" "LeadRating" NOT NULL DEFAULT 'WARM';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'onecrm' AND table_name = 'Lead' AND column_name = 'score'
  ) THEN
    UPDATE "Lead"
    SET "rating" = CASE
      WHEN "score" IS NULL THEN 'WARM'::"LeadRating"
      WHEN "score" >= 70 THEN 'HOT'::"LeadRating"
      WHEN "score" >= 40 THEN 'WARM'::"LeadRating"
      WHEN "score" >= 20 THEN 'COLD'::"LeadRating"
      ELSE 'MAYBE'::"LeadRating"
    END;
    ALTER TABLE "Lead" DROP COLUMN "score";
  END IF;
END $$;

-- Foreign keys (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Lead_assignedById_fkey'
  ) THEN
    ALTER TABLE "Lead"
      ADD CONSTRAINT "Lead_assignedById_fkey"
      FOREIGN KEY ("assignedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Lead_studentUserId_fkey'
  ) THEN
    ALTER TABLE "Lead"
      ADD CONSTRAINT "Lead_studentUserId_fkey"
      FOREIGN KEY ("studentUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- =====================================================
-- 3. Campaign — Meta / launch fields
-- =====================================================
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "externalLeadId" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "audienceType" TEXT NOT NULL DEFAULT 'ALL';
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "externalCampaignId" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "platform" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "launchDetails" JSONB;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "emailContent" JSONB;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "metaAdId" TEXT;

-- =====================================================
-- 4. CampaignLaunchLog — launchedAt (schema expects it)
-- =====================================================
ALTER TABLE "CampaignLaunchLog" ADD COLUMN IF NOT EXISTS "launchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
