-- AlterEnum
ALTER TYPE "TrainingCourseCategory" ADD VALUE 'IELTS_PREP';
ALTER TYPE "TrainingCourseCategory" ADD VALUE 'VISA_TRAINING';

-- CreateEnum
CREATE TYPE "TrainingProgramType" AS ENUM ('IELTS_PREP', 'VISA_TRAINING');

-- CreateEnum
CREATE TYPE "TrainingDeliveryMode" AS ENUM ('ONE_ON_ONE', 'GROUP');

-- CreateEnum
CREATE TYPE "TrainingBatchStatus" AS ENUM ('DRAFT', 'OPEN', 'FULL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TrainingSeatPaymentStatus" AS ENUM ('UNPAID', 'PAID', 'WAIVED');

-- CreateTable
CREATE TABLE "TrainingBatch" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "programType" "TrainingProgramType" NOT NULL,
    "deliveryMode" "TrainingDeliveryMode" NOT NULL DEFAULT 'ONE_ON_ONE',
    "maxSeats" INTEGER NOT NULL DEFAULT 1,
    "status" "TrainingBatchStatus" NOT NULL DEFAULT 'OPEN',
    "trainerId" INTEGER,
    "courseId" INTEGER,
    "feeAmountPaise" INTEGER,
    "scheduledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingBatchMember" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignedById" INTEGER,
    "paymentStatus" "TrainingSeatPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingBatchMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingBatch_deletedAt_idx" ON "TrainingBatch"("deletedAt");

-- CreateIndex
CREATE INDEX "TrainingBatch_programType_status_deletedAt_idx" ON "TrainingBatch"("programType", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "TrainingBatch_trainerId_idx" ON "TrainingBatch"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBatchMember_batchId_userId_key" ON "TrainingBatchMember"("batchId", "userId");

-- CreateIndex
CREATE INDEX "TrainingBatchMember_userId_idx" ON "TrainingBatchMember"("userId");

-- CreateIndex
CREATE INDEX "TrainingBatchMember_paymentStatus_idx" ON "TrainingBatchMember"("paymentStatus");

-- AddForeignKey
ALTER TABLE "TrainingBatch" ADD CONSTRAINT "TrainingBatch_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBatch" ADD CONSTRAINT "TrainingBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBatch" ADD CONSTRAINT "TrainingBatch_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBatchMember" ADD CONSTRAINT "TrainingBatchMember_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "TrainingBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBatchMember" ADD CONSTRAINT "TrainingBatchMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBatchMember" ADD CONSTRAINT "TrainingBatchMember_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
