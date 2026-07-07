-- Agent CRM Phase 2: onboarding, documents, communications, commission rules

CREATE TYPE "AgencyOnboardingStage" AS ENUM (
  'REGISTERED',
  'DOCS_SUBMITTED',
  'AGREEMENT_SIGNED',
  'VERIFIED',
  'APPROVED',
  'ACTIVE'
);

CREATE TYPE "AgencyDocumentType" AS ENUM (
  'CONTRACT',
  'AGREEMENT',
  'COMMISSION_POLICY',
  'KYC_ID',
  'BUSINESS_REGISTRATION',
  'OTHER'
);

CREATE TYPE "AgencyActivityType" AS ENUM (
  'EMAIL',
  'CALL',
  'MEETING',
  'NOTE',
  'BROADCAST'
);

CREATE TYPE "CommissionRuleType" AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE "CommissionTrigger" AS ENUM ('ENROLLED', 'VISA_APPROVED');

ALTER TYPE "AgencyPartnerStatus" ADD VALUE IF NOT EXISTS 'VERIFIED';
ALTER TYPE "AgencyPartnerStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "AgencyPartnerStatus" ADD VALUE IF NOT EXISTS 'INACTIVE';
ALTER TYPE "AgencyPartnerStatus" ADD VALUE IF NOT EXISTS 'BLACKLISTED';

ALTER TABLE "AgencyPartner"
  ADD COLUMN IF NOT EXISTS "services" TEXT,
  ADD COLUMN IF NOT EXISTS "onboardingStage" "AgencyOnboardingStage" NOT NULL DEFAULT 'REGISTERED',
  ADD COLUMN IF NOT EXISTS "agreementSignedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "activatedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "AgencyPartnerDocument" (
  "id" SERIAL NOT NULL,
  "agencyPartnerId" INTEGER NOT NULL,
  "type" "AgencyDocumentType" NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "notes" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgencyPartnerDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgencyPartnerDocument_agencyPartnerId_fkey"
    FOREIGN KEY ("agencyPartnerId") REFERENCES "AgencyPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AgencyActivity" (
  "id" SERIAL NOT NULL,
  "agencyPartnerId" INTEGER NOT NULL,
  "actorId" INTEGER,
  "activityType" "AgencyActivityType" NOT NULL,
  "subject" TEXT,
  "comment" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgencyActivity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgencyActivity_agencyPartnerId_fkey"
    FOREIGN KEY ("agencyPartnerId") REFERENCES "AgencyPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgencyActivity_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AgencyCommissionRule" (
  "id" SERIAL NOT NULL,
  "agencyPartnerId" INTEGER,
  "country" TEXT,
  "university" TEXT,
  "ruleType" "CommissionRuleType" NOT NULL DEFAULT 'PERCENTAGE',
  "amount" DOUBLE PRECISION NOT NULL,
  "trigger" "CommissionTrigger" NOT NULL DEFAULT 'ENROLLED',
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgencyCommissionRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgencyCommissionRule_agencyPartnerId_fkey"
    FOREIGN KEY ("agencyPartnerId") REFERENCES "AgencyPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AgencyPartnerDocument_agencyPartnerId_type_idx"
  ON "AgencyPartnerDocument"("agencyPartnerId", "type");
CREATE INDEX IF NOT EXISTS "AgencyActivity_agencyPartnerId_createdAt_idx"
  ON "AgencyActivity"("agencyPartnerId", "createdAt");
CREATE INDEX IF NOT EXISTS "AgencyCommissionRule_agencyPartnerId_idx"
  ON "AgencyCommissionRule"("agencyPartnerId");
CREATE INDEX IF NOT EXISTS "AgencyCommissionRule_country_university_idx"
  ON "AgencyCommissionRule"("country", "university");

CREATE UNIQUE INDEX IF NOT EXISTS "AgencyReferral_leadId_key"
  ON "AgencyReferral"("leadId") WHERE "leadId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "AgencyReferral_studentId_key"
  ON "AgencyReferral"("studentId") WHERE "studentId" IS NOT NULL;
