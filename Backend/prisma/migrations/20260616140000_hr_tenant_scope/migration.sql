-- Tenant-scope HR root tables. Child tables (HrAttendanceRecord, HrLeaveRequest,
-- HrPayslip, etc.) inherit isolation via their FK chain to a tenant-scoped root.
-- All existing rows are backfilled to the Default tenant (slug='default').

-- Ensure unqualified references resolve to the onecrm schema regardless of
-- the session-level search_path the migration engine connects with.
SET search_path TO "onecrm", public;

-- HrEmployee
ALTER TABLE "HrEmployee" ADD COLUMN "tenantId" INTEGER;
UPDATE "HrEmployee" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'default');
ALTER TABLE "HrEmployee"
  ADD CONSTRAINT "HrEmployee_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "HrEmployee_tenantId_idx" ON "HrEmployee"("tenantId");

-- HrAttendanceDevice
ALTER TABLE "HrAttendanceDevice" ADD COLUMN "tenantId" INTEGER;
UPDATE "HrAttendanceDevice" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'default');
ALTER TABLE "HrAttendanceDevice"
  ADD CONSTRAINT "HrAttendanceDevice_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "HrAttendanceDevice_tenantId_idx" ON "HrAttendanceDevice"("tenantId");

-- HrNetworkWhitelist
ALTER TABLE "HrNetworkWhitelist" ADD COLUMN "tenantId" INTEGER;
UPDATE "HrNetworkWhitelist" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'default');
ALTER TABLE "HrNetworkWhitelist"
  ADD CONSTRAINT "HrNetworkWhitelist_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "HrNetworkWhitelist_tenantId_idx" ON "HrNetworkWhitelist"("tenantId");

-- HrLeavePlan
ALTER TABLE "HrLeavePlan" ADD COLUMN "tenantId" INTEGER;
UPDATE "HrLeavePlan" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'default');
ALTER TABLE "HrLeavePlan"
  ADD CONSTRAINT "HrLeavePlan_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "HrLeavePlan_tenantId_idx" ON "HrLeavePlan"("tenantId");

-- HrLeaveType
ALTER TABLE "HrLeaveType" ADD COLUMN "tenantId" INTEGER;
UPDATE "HrLeaveType" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'default');
ALTER TABLE "HrLeaveType"
  ADD CONSTRAINT "HrLeaveType_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "HrLeaveType_tenantId_idx" ON "HrLeaveType"("tenantId");

-- HrHoliday
ALTER TABLE "HrHoliday" ADD COLUMN "tenantId" INTEGER;
UPDATE "HrHoliday" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'default');
ALTER TABLE "HrHoliday"
  ADD CONSTRAINT "HrHoliday_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "HrHoliday_tenantId_idx" ON "HrHoliday"("tenantId");

-- HrJobPosting
ALTER TABLE "HrJobPosting" ADD COLUMN "tenantId" INTEGER;
UPDATE "HrJobPosting" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'default');
ALTER TABLE "HrJobPosting"
  ADD CONSTRAINT "HrJobPosting_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "HrJobPosting_tenantId_idx" ON "HrJobPosting"("tenantId");

-- HrKpiDefinition
ALTER TABLE "HrKpiDefinition" ADD COLUMN "tenantId" INTEGER;
UPDATE "HrKpiDefinition" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'default');
ALTER TABLE "HrKpiDefinition"
  ADD CONSTRAINT "HrKpiDefinition_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "HrKpiDefinition_tenantId_idx" ON "HrKpiDefinition"("tenantId");

-- HrProcessingMetric
ALTER TABLE "HrProcessingMetric" ADD COLUMN "tenantId" INTEGER;
UPDATE "HrProcessingMetric" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'default');
ALTER TABLE "HrProcessingMetric"
  ADD CONSTRAINT "HrProcessingMetric_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "HrProcessingMetric_tenantId_idx" ON "HrProcessingMetric"("tenantId");

-- HrMarketingPerformance
ALTER TABLE "HrMarketingPerformance" ADD COLUMN "tenantId" INTEGER;
UPDATE "HrMarketingPerformance" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'default');
ALTER TABLE "HrMarketingPerformance"
  ADD CONSTRAINT "HrMarketingPerformance_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "HrMarketingPerformance_tenantId_idx" ON "HrMarketingPerformance"("tenantId");

-- HrCounsellorPerformance
ALTER TABLE "HrCounsellorPerformance" ADD COLUMN "tenantId" INTEGER;
UPDATE "HrCounsellorPerformance" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'default');
ALTER TABLE "HrCounsellorPerformance"
  ADD CONSTRAINT "HrCounsellorPerformance_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "HrCounsellorPerformance_tenantId_idx" ON "HrCounsellorPerformance"("tenantId");

-- HrPerformanceReview
ALTER TABLE "HrPerformanceReview" ADD COLUMN "tenantId" INTEGER;
UPDATE "HrPerformanceReview" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'default');
ALTER TABLE "HrPerformanceReview"
  ADD CONSTRAINT "HrPerformanceReview_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "HrPerformanceReview_tenantId_idx" ON "HrPerformanceReview"("tenantId");
