SET search_path TO "onecrm", public;

-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "HrEmploymentStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "HrEmployeeDocumentType" AS ENUM ('OFFER_LETTER', 'ID_PROOF', 'CONTRACT', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "HrEmployee" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "HrEmployee" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "HrEmployee" ADD COLUMN IF NOT EXISTS "joiningDate" TEXT;
ALTER TABLE "HrEmployee" ADD COLUMN IF NOT EXISTS "managerId" INTEGER;
ALTER TABLE "HrEmployee" ADD COLUMN IF NOT EXISTS "employmentStatus" "HrEmploymentStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "HrEmployee" ADD COLUMN IF NOT EXISTS "resignedAt" TIMESTAMP(3);
ALTER TABLE "HrEmployee" ADD COLUMN IF NOT EXISTS "terminatedAt" TIMESTAMP(3);
ALTER TABLE "HrEmployee" ADD COLUMN IF NOT EXISTS "exitReason" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "HrEmployeeDocument" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER,
    "employeeId" INTEGER NOT NULL,
    "type" "HrEmployeeDocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "sourceOfferLetterId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrEmployeeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "HrEmployee_employmentStatus_idx" ON "HrEmployee"("employmentStatus");
CREATE INDEX IF NOT EXISTS "HrEmployee_managerId_idx" ON "HrEmployee"("managerId");
CREATE INDEX IF NOT EXISTS "HrEmployeeDocument_employeeId_type_idx" ON "HrEmployeeDocument"("employeeId", "type");
CREATE INDEX IF NOT EXISTS "HrEmployeeDocument_tenantId_idx" ON "HrEmployeeDocument"("tenantId");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  ALTER TABLE "HrEmployee" ADD CONSTRAINT "HrEmployee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "HrEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "HrEmployeeDocument" ADD CONSTRAINT "HrEmployeeDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "HrEmployeeDocument" ADD CONSTRAINT "HrEmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
