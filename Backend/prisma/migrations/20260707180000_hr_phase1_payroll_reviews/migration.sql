-- Phase 1 HR: performance-linked payroll + weekly reviews + revenue on reviews

ALTER TABLE "HrSalaryStructure"
  ADD COLUMN IF NOT EXISTS "incentivePerEnrollment" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "incentiveRevenueShare" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "HrPayslip"
  ADD COLUMN IF NOT EXISTS "performanceIncentive" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "HrPerformanceReview"
  ADD COLUMN IF NOT EXISTS "frequency" "HrKpiFrequency" NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0;
