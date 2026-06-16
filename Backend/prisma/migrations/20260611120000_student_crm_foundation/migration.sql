-- Student CRM foundation: settings master data, extended student profile, supporting tables

-- CreateEnum
CREATE TYPE "ApplicationProcessStage" AS ENUM (
  'GATHERING_CHECKLIST',
  'UNIVERSITY_APPLICATION',
  'FINANCIAL_EVIDENCE',
  'AFTER_I20',
  'PRE_CAS_PROCESS',
  'VISA_APPLICATION',
  'PRE_DEPARTURE',
  'ON_ARRIVAL',
  'PRE_REQUISITE'
);

-- CreateTable: Student CRM core (if not exists from prior db push)
CREATE TABLE IF NOT EXISTS "Student" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dob" TIMESTAMP(3),
    "nationality" TEXT,
    "preferredCountry" TEXT,
    "academicHistory" JSONB,
    "ieltsScore" DOUBLE PRECISION,
    "toeflScore" DOUBLE PRECISION,
    "greScore" DOUBLE PRECISION,
    "gmatScore" DOUBLE PRECISION,
    "source" TEXT,
    "sourceLeadId" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Application" (
    "id" SERIAL NOT NULL,
    "applicationCode" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "intake" TEXT,
    "stage" "ApplicationStage" NOT NULL DEFAULT 'DRAFT',
    "assignedToId" INTEGER,
    "deadline" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ApplicationStageEvent" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "fromStage" "ApplicationStage",
    "toStage" "ApplicationStage" NOT NULL,
    "changedById" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationStageEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ApplicationDocument" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "filename" TEXT,
    "fileUrl" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OfferLetter" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "fileUrl" TEXT,
    "filename" TEXT,
    "receivedAt" TIMESTAMP(3),
    "conditional" BOOLEAN NOT NULL DEFAULT false,
    "decisionDeadline" TIMESTAMP(3),
    "studentDecision" "OfferDecisionStatus" NOT NULL DEFAULT 'PENDING',
    "decisionAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OfferLetter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VisaTracking" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "status" "VisaStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "appointmentDate" TIMESTAMP(3),
    "decisionDate" TIMESTAMP(3),
    "documents" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VisaTracking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DocumentChecklistTemplate" (
    "id" SERIAL NOT NULL,
    "country" TEXT NOT NULL,
    "university" TEXT,
    "documents" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DocumentChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CRM Settings
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "currency" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudyIndustry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudyIndustry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudySubIndustry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "industryId" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudySubIndustry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudyArea" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "industryId" INTEGER NOT NULL,
    "subIndustryId" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudyArea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "University" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" INTEGER NOT NULL,
    "city" TEXT,
    "location" TEXT,
    "logo" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- Extend Student
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "level" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "countryId" INTEGER;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "industryId" INTEGER;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "subIndustryId" INTEGER;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "studyAreaId" INTEGER;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "intakeMonth" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "intakeYear" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "studyMode" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "studyDuration" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "studyBudget" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "studyAttendanceType" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "typeOfDegree" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "workExperience" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "recLevelAcademic" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "recGradeAchieved" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "preStudyLoc" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "educationDetails" JSONB;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "asstExamSections" JSONB;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "contactId" INTEGER;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "processStage" "ApplicationProcessStage" NOT NULL DEFAULT 'GATHERING_CHECKLIST';
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "stageTotalTask" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "stageCompletedTask" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "totalCheckList" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "completedCheckList" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "stepsTimestamp" JSONB;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'CURRENT';
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "isEnrolled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Supporting tables
CREATE TABLE "StudentUniversity" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "universityId" INTEGER NOT NULL,
    "value" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Application Processing',
    "appliedIntake" TEXT,
    "offerIntake" TEXT,
    "courseLink" TEXT,
    "defer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentUniversity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CheckList" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stage" "ApplicationProcessStage" NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CheckList_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CountryChecklist" (
    "id" SERIAL NOT NULL,
    "countryId" INTEGER NOT NULL,
    "checkListId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CountryChecklist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentChecklist" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "checkListId" INTEGER NOT NULL,
    "value" TEXT,
    "linkUrl" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentChecklist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Resource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "slug" TEXT NOT NULL,
    "parentId" INTEGER,
    "userType" INTEGER NOT NULL DEFAULT 1,
    "folderImage" TEXT,
    "isFolder" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Faq" (
    "id" SERIAL NOT NULL,
    "countryId" INTEGER,
    "query" VARCHAR(200) NOT NULL,
    "solution" VARCHAR(500) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdditionalService" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "dob" TEXT,
    "gender" TEXT,
    "passportNo" TEXT,
    "presentStatus" TEXT,
    "countryId" INTEGER,
    "selectedService" TEXT,
    "images" JSONB,
    "notes" TEXT,
    "callBackTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'NOT_CONTACTED',
    "isContacted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdditionalService_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Chat" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Student_userId_key" ON "Student"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Student_email_key" ON "Student"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Student_sourceLeadId_key" ON "Student"("sourceLeadId");
CREATE UNIQUE INDEX IF NOT EXISTS "Application_applicationCode_key" ON "Application"("applicationCode");
CREATE UNIQUE INDEX IF NOT EXISTS "OfferLetter_applicationId_key" ON "OfferLetter"("applicationId");
CREATE UNIQUE INDEX IF NOT EXISTS "VisaTracking_applicationId_key" ON "VisaTracking"("applicationId");
CREATE UNIQUE INDEX IF NOT EXISTS "Country_name_key" ON "Country"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "StudyIndustry_name_key" ON "StudyIndustry"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "StudySubIndustry_industryId_name_key" ON "StudySubIndustry"("industryId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "StudyArea_industryId_name_key" ON "StudyArea"("industryId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "University_countryId_name_key" ON "University"("countryId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "StudentUniversity_studentId_universityId_key" ON "StudentUniversity"("studentId", "universityId");
CREATE UNIQUE INDEX IF NOT EXISTS "CountryChecklist_countryId_checkListId_key" ON "CountryChecklist"("countryId", "checkListId");
CREATE UNIQUE INDEX IF NOT EXISTS "StudentChecklist_studentId_checkListId_key" ON "StudentChecklist"("studentId", "checkListId");
CREATE UNIQUE INDEX IF NOT EXISTS "Resource_slug_key" ON "Resource"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Feedback_studentId_key" ON "Feedback"("studentId");

-- Foreign keys (idempotent via DO blocks where needed)
DO $$ BEGIN
  ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Student" ADD CONSTRAINT "Student_sourceLeadId_fkey" FOREIGN KEY ("sourceLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Student" ADD CONSTRAINT "Student_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Student" ADD CONSTRAINT "Student_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Student" ADD CONSTRAINT "Student_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "StudyIndustry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Student" ADD CONSTRAINT "Student_subIndustryId_fkey" FOREIGN KEY ("subIndustryId") REFERENCES "StudySubIndustry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Student" ADD CONSTRAINT "Student_studyAreaId_fkey" FOREIGN KEY ("studyAreaId") REFERENCES "StudyArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "StudySubIndustry" ADD CONSTRAINT "StudySubIndustry_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "StudyIndustry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyArea" ADD CONSTRAINT "StudyArea_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "StudyIndustry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyArea" ADD CONSTRAINT "StudyArea_subIndustryId_fkey" FOREIGN KEY ("subIndustryId") REFERENCES "StudySubIndustry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "University" ADD CONSTRAINT "University_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentUniversity" ADD CONSTRAINT "StudentUniversity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentUniversity" ADD CONSTRAINT "StudentUniversity_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CountryChecklist" ADD CONSTRAINT "CountryChecklist_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CountryChecklist" ADD CONSTRAINT "CountryChecklist_checkListId_fkey" FOREIGN KEY ("checkListId") REFERENCES "CheckList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentChecklist" ADD CONSTRAINT "StudentChecklist_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentChecklist" ADD CONSTRAINT "StudentChecklist_checkListId_fkey" FOREIGN KEY ("checkListId") REFERENCES "CheckList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DO $$ BEGIN
  ALTER TABLE "Application" ADD CONSTRAINT "Application_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Application" ADD CONSTRAINT "Application_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "Student_contactId_idx" ON "Student"("contactId");
CREATE INDEX IF NOT EXISTS "Student_deletedAt_idx" ON "Student"("deletedAt");
