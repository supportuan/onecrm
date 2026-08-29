-- AlterTable
ALTER TABLE "OrgSettings" ADD COLUMN IF NOT EXISTS "tagline" TEXT;
ALTER TABLE "OrgSettings" ADD COLUMN IF NOT EXISTS "loginHeadline" TEXT;
ALTER TABLE "OrgSettings" ADD COLUMN IF NOT EXISTS "loginBackgroundUrl" TEXT;
ALTER TABLE "OrgSettings" ADD COLUMN IF NOT EXISTS "alliedServices" JSONB;
