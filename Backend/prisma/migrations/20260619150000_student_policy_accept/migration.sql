SET search_path TO "onecrm", public;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "policyAcceptedAt" TIMESTAMP(3);
