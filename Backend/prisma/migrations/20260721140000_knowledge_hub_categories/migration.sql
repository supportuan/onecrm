SET search_path TO "onecrm", public;

DO $$
BEGIN
  CREATE TYPE "ResourceCategory" AS ENUM ('INHOUSE', 'ACADEMICS', 'AGENTS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Resource"
  ADD COLUMN IF NOT EXISTS "category" "ResourceCategory" NOT NULL DEFAULT 'INHOUSE',
  ADD COLUMN IF NOT EXISTS "targetCountries" JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE "Resource"
SET "targetRoles" = '["ALL"]'::jsonb
WHERE "targetRoles" IS NULL
   OR "targetRoles" = '[]'::jsonb;

CREATE INDEX IF NOT EXISTS "Resource_category_isPublished_deletedAt_idx"
  ON "Resource"("category", "isPublished", "deletedAt");
