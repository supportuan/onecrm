-- Add conversion-based metrics to performance reviews
ALTER TABLE "HrPerformanceReview" ADD COLUMN "reviewPeriod" TEXT;
ALTER TABLE "HrPerformanceReview" ADD COLUMN "leadsHandled" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "HrPerformanceReview" ADD COLUMN "conversions" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "HrPerformanceReview" ADD COLUMN "enrollments" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "HrPerformanceReview" ADD COLUMN "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX "HrPerformanceReview_employeeId_cycle_idx" ON "HrPerformanceReview"("employeeId", "cycle");
