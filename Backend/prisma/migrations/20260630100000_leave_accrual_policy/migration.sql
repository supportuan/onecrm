-- Leave policy: monthly/quarterly accrual and rate (e.g. 2 days per month, no carry-forward)
ALTER TABLE "HrLeaveDefinition" ADD COLUMN IF NOT EXISTS "accrualType" TEXT NOT NULL DEFAULT 'yearly';
ALTER TABLE "HrLeaveDefinition" ADD COLUMN IF NOT EXISTS "accrualRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
