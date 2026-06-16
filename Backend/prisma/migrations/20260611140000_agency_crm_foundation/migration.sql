-- CreateEnum
CREATE TYPE "AgencyPartnerStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "AgencyPartner" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "agencyName" TEXT NOT NULL,
    "agencyCode" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "status" "AgencyPartnerStatus" NOT NULL DEFAULT 'PENDING',
    "branding" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyReferral" (
    "id" SERIAL NOT NULL,
    "agencyPartnerId" INTEGER NOT NULL,
    "leadId" INTEGER,
    "studentId" INTEGER,
    "applicationId" INTEGER,
    "referralCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REFERRED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyCommission" (
    "id" SERIAL NOT NULL,
    "agencyPartnerId" INTEGER NOT NULL,
    "studentId" INTEGER,
    "applicationId" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "period" TEXT,
    "description" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyPartner_userId_key" ON "AgencyPartner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyPartner_agencyCode_key" ON "AgencyPartner"("agencyCode");

-- CreateIndex
CREATE INDEX "AgencyPartner_status_idx" ON "AgencyPartner"("status");

-- CreateIndex
CREATE INDEX "AgencyPartner_agencyCode_idx" ON "AgencyPartner"("agencyCode");

-- CreateIndex
CREATE INDEX "AgencyReferral_agencyPartnerId_idx" ON "AgencyReferral"("agencyPartnerId");

-- CreateIndex
CREATE INDEX "AgencyReferral_leadId_idx" ON "AgencyReferral"("leadId");

-- CreateIndex
CREATE INDEX "AgencyReferral_studentId_idx" ON "AgencyReferral"("studentId");

-- CreateIndex
CREATE INDEX "AgencyReferral_applicationId_idx" ON "AgencyReferral"("applicationId");

-- CreateIndex
CREATE INDEX "AgencyCommission_agencyPartnerId_idx" ON "AgencyCommission"("agencyPartnerId");

-- CreateIndex
CREATE INDEX "AgencyCommission_status_idx" ON "AgencyCommission"("status");

-- CreateIndex
CREATE INDEX "Student_source_idx" ON "Student"("source");

-- AddForeignKey
ALTER TABLE "AgencyPartner" ADD CONSTRAINT "AgencyPartner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyReferral" ADD CONSTRAINT "AgencyReferral_agencyPartnerId_fkey" FOREIGN KEY ("agencyPartnerId") REFERENCES "AgencyPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyReferral" ADD CONSTRAINT "AgencyReferral_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyReferral" ADD CONSTRAINT "AgencyReferral_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyReferral" ADD CONSTRAINT "AgencyReferral_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyCommission" ADD CONSTRAINT "AgencyCommission_agencyPartnerId_fkey" FOREIGN KEY ("agencyPartnerId") REFERENCES "AgencyPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyCommission" ADD CONSTRAINT "AgencyCommission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyCommission" ADD CONSTRAINT "AgencyCommission_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
