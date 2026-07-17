-- HR two-step leave approval
ALTER TYPE "HrLeaveRequestStatus" ADD VALUE IF NOT EXISTS 'MANAGER_APPROVED';

ALTER TABLE "HrLeaveRequest"
  ADD COLUMN IF NOT EXISTS "managerReviewerNote" TEXT,
  ADD COLUMN IF NOT EXISTS "managerReviewedAt" TIMESTAMP(3);

-- Application tasks
CREATE TYPE "ApplicationTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS "ApplicationTask" (
  "id" SERIAL PRIMARY KEY,
  "applicationId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "assignedToId" INTEGER,
  "createdById" INTEGER,
  "dueDate" TIMESTAMP(3),
  "status" "ApplicationTaskStatus" NOT NULL DEFAULT 'PENDING',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationTask_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ApplicationTask_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ApplicationTask_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ApplicationTask_applicationId_status_idx"
  ON "ApplicationTask"("applicationId", "status");
CREATE INDEX IF NOT EXISTS "ApplicationTask_assignedToId_status_dueDate_idx"
  ON "ApplicationTask"("assignedToId", "status", "dueDate");

-- Visa document checklists
CREATE TABLE IF NOT EXISTS "VisaDocument" (
  "id" SERIAL PRIMARY KEY,
  "visaTrackingId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "filename" TEXT,
  "fileUrl" TEXT,
  "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
  "uploadedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VisaDocument_visaTrackingId_fkey"
    FOREIGN KEY ("visaTrackingId") REFERENCES "VisaTracking"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "VisaDocument_visaTrackingId_status_idx"
  ON "VisaDocument"("visaTrackingId", "status");

CREATE TABLE IF NOT EXISTS "VisaDocumentChecklistTemplate" (
  "id" SERIAL PRIMARY KEY,
  "country" TEXT NOT NULL,
  "documents" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VisaDocumentChecklistTemplate_country_key" UNIQUE ("country")
);
