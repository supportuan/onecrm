-- Phase 2: Agency CRM hardening — referral uniqueness, document versions,
-- commission verification, agreement acceptances, payouts, announcements,
-- payment actor attribution.

-- ---------------------------------------------------------------------------
-- 1) Dedupe AgencyReferral before unique constraints (keep oldest row)
-- ---------------------------------------------------------------------------
UPDATE "onecrm"."AgencyReferral" AS r
SET "leadId" = NULL
WHERE r."leadId" IS NOT NULL
  AND r."id" NOT IN (
    SELECT MIN(r2."id")
    FROM "onecrm"."AgencyReferral" r2
    WHERE r2."leadId" IS NOT NULL
    GROUP BY r2."leadId"
  );

UPDATE "onecrm"."AgencyReferral" AS r
SET "studentId" = NULL
WHERE r."studentId" IS NOT NULL
  AND r."id" NOT IN (
    SELECT MIN(r2."id")
    FROM "onecrm"."AgencyReferral" r2
    WHERE r2."studentId" IS NOT NULL
    GROUP BY r2."studentId"
  );

-- ---------------------------------------------------------------------------
-- 2) Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "onecrm"."AgencyDocumentVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "onecrm"."AgencyAnnouncementType" AS ENUM ('GENERAL', 'POLICY', 'SCHOLARSHIP', 'UNIVERSITY_UPDATE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "onecrm"."CommissionPayoutStatus" AS ENUM ('DRAFT', 'PROCESSING', 'PAID', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 3) AgencyPartnerDocument versioning / verification
-- ---------------------------------------------------------------------------
ALTER TABLE "onecrm"."AgencyPartnerDocument"
  ADD COLUMN IF NOT EXISTS "verificationStatus" "onecrm"."AgencyDocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "replacedById" INTEGER;

DO $$ BEGIN
  ALTER TABLE "onecrm"."AgencyPartnerDocument"
    ADD CONSTRAINT "AgencyPartnerDocument_replacedById_fkey"
    FOREIGN KEY ("replacedById") REFERENCES "onecrm"."AgencyPartnerDocument"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "AgencyPartnerDocument_verificationStatus_idx"
  ON "onecrm"."AgencyPartnerDocument"("verificationStatus");

-- ---------------------------------------------------------------------------
-- 4) AgencyActivity optional student / application links
-- ---------------------------------------------------------------------------
ALTER TABLE "onecrm"."AgencyActivity"
  ADD COLUMN IF NOT EXISTS "studentId" INTEGER,
  ADD COLUMN IF NOT EXISTS "applicationId" INTEGER;

CREATE INDEX IF NOT EXISTS "AgencyActivity_studentId_idx"
  ON "onecrm"."AgencyActivity"("studentId");
CREATE INDEX IF NOT EXISTS "AgencyActivity_applicationId_idx"
  ON "onecrm"."AgencyActivity"("applicationId");

-- ---------------------------------------------------------------------------
-- 5) AgencyCommission verification + INR default for new rows (column default only)
-- ---------------------------------------------------------------------------
ALTER TABLE "onecrm"."AgencyCommission"
  ADD COLUMN IF NOT EXISTS "verifiedById" INTEGER,
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);

ALTER TABLE "onecrm"."AgencyCommission"
  ALTER COLUMN "currency" SET DEFAULT 'INR';

DO $$ BEGIN
  ALTER TABLE "onecrm"."AgencyCommission"
    ADD CONSTRAINT "AgencyCommission_verifiedById_fkey"
    FOREIGN KEY ("verifiedById") REFERENCES "onecrm"."User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "AgencyCommission_agencyPartnerId_status_idx"
  ON "onecrm"."AgencyCommission"("agencyPartnerId", "status");
CREATE INDEX IF NOT EXISTS "AgencyCommission_verifiedById_idx"
  ON "onecrm"."AgencyCommission"("verifiedById");

-- ---------------------------------------------------------------------------
-- 6) AgencyReferral unique constraints (one agent per lead/student)
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS "onecrm"."AgencyReferral_leadId_idx";
DROP INDEX IF EXISTS "onecrm"."AgencyReferral_studentId_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "AgencyReferral_leadId_key"
  ON "onecrm"."AgencyReferral"("leadId");
CREATE UNIQUE INDEX IF NOT EXISTS "AgencyReferral_studentId_key"
  ON "onecrm"."AgencyReferral"("studentId");

-- ---------------------------------------------------------------------------
-- 7) Agreement acceptances
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "onecrm"."AgencyAgreementAcceptance" (
  "id" SERIAL NOT NULL,
  "agencyPartnerId" INTEGER NOT NULL,
  "agreementVersion" TEXT NOT NULL DEFAULT 'v1',
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "actorId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgencyAgreementAcceptance_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "onecrm"."AgencyAgreementAcceptance"
    ADD CONSTRAINT "AgencyAgreementAcceptance_agencyPartnerId_fkey"
    FOREIGN KEY ("agencyPartnerId") REFERENCES "onecrm"."AgencyPartner"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "onecrm"."AgencyAgreementAcceptance"
    ADD CONSTRAINT "AgencyAgreementAcceptance_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "onecrm"."User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "AgencyAgreementAcceptance_agencyPartnerId_acceptedAt_idx"
  ON "onecrm"."AgencyAgreementAcceptance"("agencyPartnerId", "acceptedAt");

-- ---------------------------------------------------------------------------
-- 8) Announcements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "onecrm"."AgencyAnnouncement" (
  "id" SERIAL NOT NULL,
  "type" "onecrm"."AgencyAnnouncementType" NOT NULL DEFAULT 'GENERAL',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "link" TEXT,
  "publishedAt" TIMESTAMP(3),
  "publishedById" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgencyAnnouncement_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "onecrm"."AgencyAnnouncement"
    ADD CONSTRAINT "AgencyAnnouncement_publishedById_fkey"
    FOREIGN KEY ("publishedById") REFERENCES "onecrm"."User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "AgencyAnnouncement_publishedAt_idx"
  ON "onecrm"."AgencyAnnouncement"("publishedAt");
CREATE INDEX IF NOT EXISTS "AgencyAnnouncement_isActive_publishedAt_idx"
  ON "onecrm"."AgencyAnnouncement"("isActive", "publishedAt");

CREATE TABLE IF NOT EXISTS "onecrm"."AgencyAnnouncementRead" (
  "id" SERIAL NOT NULL,
  "announcementId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgencyAnnouncementRead_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "onecrm"."AgencyAnnouncementRead"
    ADD CONSTRAINT "AgencyAnnouncementRead_announcementId_fkey"
    FOREIGN KEY ("announcementId") REFERENCES "onecrm"."AgencyAnnouncement"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "onecrm"."AgencyAnnouncementRead"
    ADD CONSTRAINT "AgencyAnnouncementRead_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "onecrm"."User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "AgencyAnnouncementRead_announcementId_userId_key"
  ON "onecrm"."AgencyAnnouncementRead"("announcementId", "userId");
CREATE INDEX IF NOT EXISTS "AgencyAnnouncementRead_userId_idx"
  ON "onecrm"."AgencyAnnouncementRead"("userId");

-- ---------------------------------------------------------------------------
-- 9) Commission payouts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "onecrm"."CommissionPayout" (
  "id" SERIAL NOT NULL,
  "period" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "onecrm"."CommissionPayoutStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommissionPayout_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "onecrm"."CommissionPayout"
    ADD CONSTRAINT "CommissionPayout_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "onecrm"."User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "CommissionPayout_status_idx"
  ON "onecrm"."CommissionPayout"("status");
CREATE INDEX IF NOT EXISTS "CommissionPayout_period_idx"
  ON "onecrm"."CommissionPayout"("period");

CREATE TABLE IF NOT EXISTS "onecrm"."CommissionPayoutLine" (
  "id" SERIAL NOT NULL,
  "payoutId" INTEGER NOT NULL,
  "commissionId" INTEGER NOT NULL,
  "agencyPartnerId" INTEGER NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "CommissionPayoutLine_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "onecrm"."CommissionPayoutLine"
    ADD CONSTRAINT "CommissionPayoutLine_payoutId_fkey"
    FOREIGN KEY ("payoutId") REFERENCES "onecrm"."CommissionPayout"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "onecrm"."CommissionPayoutLine"
    ADD CONSTRAINT "CommissionPayoutLine_commissionId_fkey"
    FOREIGN KEY ("commissionId") REFERENCES "onecrm"."AgencyCommission"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "onecrm"."CommissionPayoutLine"
    ADD CONSTRAINT "CommissionPayoutLine_agencyPartnerId_fkey"
    FOREIGN KEY ("agencyPartnerId") REFERENCES "onecrm"."AgencyPartner"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "CommissionPayoutLine_commissionId_key"
  ON "onecrm"."CommissionPayoutLine"("commissionId");
CREATE INDEX IF NOT EXISTS "CommissionPayoutLine_payoutId_idx"
  ON "onecrm"."CommissionPayoutLine"("payoutId");
CREATE INDEX IF NOT EXISTS "CommissionPayoutLine_agencyPartnerId_idx"
  ON "onecrm"."CommissionPayoutLine"("agencyPartnerId");

-- ---------------------------------------------------------------------------
-- 10) ApplicationPayment actor attribution
-- ---------------------------------------------------------------------------
ALTER TABLE "onecrm"."ApplicationPayment"
  ADD COLUMN IF NOT EXISTS "actedByUserId" INTEGER,
  ADD COLUMN IF NOT EXISTS "actorRole" TEXT;

DO $$ BEGIN
  ALTER TABLE "onecrm"."ApplicationPayment"
    ADD CONSTRAINT "ApplicationPayment_actedByUserId_fkey"
    FOREIGN KEY ("actedByUserId") REFERENCES "onecrm"."User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "ApplicationPayment_actedByUserId_idx"
  ON "onecrm"."ApplicationPayment"("actedByUserId");
