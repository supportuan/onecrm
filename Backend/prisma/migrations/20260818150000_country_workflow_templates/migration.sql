-- CreateEnum
CREATE TYPE "WorkflowSectionType" AS ENUM (
  'STUDENT_INFO',
  'DISCUSSIONS',
  'APPLICATION_PROCESS',
  'UNIVERSITY_APPLICATION',
  'SELECTION_OF_UNIVERSITY',
  'FINANCE_CALCULATOR',
  'PRE_CAS_PROCESS',
  'VISA_APPLICATION',
  'PRE_DEPARTURE',
  'ON_ARRIVAL',
  'ENROLMENT_CONFIRMATION',
  'LOGS_INFO'
);

-- CreateEnum
CREATE TYPE "WorkflowFieldType" AS ENUM (
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'DATE',
  'SELECT',
  'CHECKBOX',
  'URL',
  'CURRENCY'
);

-- AlterTable
ALTER TABLE "Application" ADD COLUMN "workflowTemplateId" INTEGER;

-- CreateTable
CREATE TABLE "ApplicationWorkflowTemplate" (
  "id" SERIAL NOT NULL,
  "tenantId" INTEGER,
  "countryId" INTEGER,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ApplicationWorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationWorkflowStageTemplate" (
  "id" SERIAL NOT NULL,
  "templateId" INTEGER NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "iconKey" TEXT,
  "sectionType" "WorkflowSectionType" NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ApplicationWorkflowStageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationWorkflowFieldTemplate" (
  "id" SERIAL NOT NULL,
  "stageTemplateId" INTEGER NOT NULL,
  "fieldKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "fieldType" "WorkflowFieldType" NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "placeholder" TEXT,
  "helpText" TEXT,
  "defaultValue" JSONB,
  "optionsJson" JSONB,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ApplicationWorkflowFieldTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationWorkflowChecklistTemplate" (
  "id" SERIAL NOT NULL,
  "stageTemplateId" INTEGER NOT NULL,
  "itemKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ApplicationWorkflowChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationWorkflowFieldValue" (
  "id" SERIAL NOT NULL,
  "applicationId" INTEGER NOT NULL,
  "fieldTemplateId" INTEGER NOT NULL,
  "valueJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ApplicationWorkflowFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationWorkflowChecklistValue" (
  "id" SERIAL NOT NULL,
  "applicationId" INTEGER NOT NULL,
  "checklistTemplateId" INTEGER NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "valueText" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ApplicationWorkflowChecklistValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Application_workflowTemplateId_idx" ON "Application"("workflowTemplateId");

-- CreateIndex
CREATE INDEX "ApplicationWorkflowTemplate_tenantId_countryId_isActive_idx" ON "ApplicationWorkflowTemplate"("tenantId", "countryId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationWorkflowStageTemplate_templateId_key_key" ON "ApplicationWorkflowStageTemplate"("templateId", "key");

-- CreateIndex
CREATE INDEX "ApplicationWorkflowStageTemplate_templateId_sortOrder_idx" ON "ApplicationWorkflowStageTemplate"("templateId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationWorkflowFieldTemplate_stageTemplateId_fieldKey_key" ON "ApplicationWorkflowFieldTemplate"("stageTemplateId", "fieldKey");

-- CreateIndex
CREATE INDEX "ApplicationWorkflowFieldTemplate_stageTemplateId_sortOrder_idx" ON "ApplicationWorkflowFieldTemplate"("stageTemplateId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationWorkflowChecklistTemplate_stageTemplateId_itemKey_key" ON "ApplicationWorkflowChecklistTemplate"("stageTemplateId", "itemKey");

-- CreateIndex
CREATE INDEX "ApplicationWorkflowChecklistTemplate_stageTemplateId_sortOrder_idx" ON "ApplicationWorkflowChecklistTemplate"("stageTemplateId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationWorkflowFieldValue_applicationId_fieldTemplateId_key" ON "ApplicationWorkflowFieldValue"("applicationId", "fieldTemplateId");

-- CreateIndex
CREATE INDEX "ApplicationWorkflowFieldValue_applicationId_idx" ON "ApplicationWorkflowFieldValue"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationWorkflowChecklistValue_applicationId_checklistTemplateId_key" ON "ApplicationWorkflowChecklistValue"("applicationId", "checklistTemplateId");

-- CreateIndex
CREATE INDEX "ApplicationWorkflowChecklistValue_applicationId_idx" ON "ApplicationWorkflowChecklistValue"("applicationId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_workflowTemplateId_fkey" FOREIGN KEY ("workflowTemplateId") REFERENCES "ApplicationWorkflowTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationWorkflowTemplate" ADD CONSTRAINT "ApplicationWorkflowTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationWorkflowTemplate" ADD CONSTRAINT "ApplicationWorkflowTemplate_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationWorkflowStageTemplate" ADD CONSTRAINT "ApplicationWorkflowStageTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ApplicationWorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationWorkflowFieldTemplate" ADD CONSTRAINT "ApplicationWorkflowFieldTemplate_stageTemplateId_fkey" FOREIGN KEY ("stageTemplateId") REFERENCES "ApplicationWorkflowStageTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationWorkflowChecklistTemplate" ADD CONSTRAINT "ApplicationWorkflowChecklistTemplate_stageTemplateId_fkey" FOREIGN KEY ("stageTemplateId") REFERENCES "ApplicationWorkflowStageTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationWorkflowFieldValue" ADD CONSTRAINT "ApplicationWorkflowFieldValue_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationWorkflowFieldValue" ADD CONSTRAINT "ApplicationWorkflowFieldValue_fieldTemplateId_fkey" FOREIGN KEY ("fieldTemplateId") REFERENCES "ApplicationWorkflowFieldTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationWorkflowChecklistValue" ADD CONSTRAINT "ApplicationWorkflowChecklistValue_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationWorkflowChecklistValue" ADD CONSTRAINT "ApplicationWorkflowChecklistValue_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "ApplicationWorkflowChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
