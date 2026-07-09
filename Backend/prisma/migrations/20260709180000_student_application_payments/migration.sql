-- CreateEnum
CREATE TYPE "ApplicationFeeType" AS ENUM ('APPLICATION_FEE', 'SERVICE_FEE', 'VISA_FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CREATED', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "ApplicationFee" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "feeType" "ApplicationFeeType" NOT NULL DEFAULT 'APPLICATION_FEE',
    "label" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationPayment" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "feeId" INTEGER,
    "studentUserId" INTEGER NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "receiptNumber" TEXT,
    "paidAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationFee_applicationId_idx" ON "ApplicationFee"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationPayment_razorpayOrderId_key" ON "ApplicationPayment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationPayment_razorpayPaymentId_key" ON "ApplicationPayment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "ApplicationPayment_applicationId_status_idx" ON "ApplicationPayment"("applicationId", "status");

-- CreateIndex
CREATE INDEX "ApplicationPayment_studentUserId_idx" ON "ApplicationPayment"("studentUserId");

-- AddForeignKey
ALTER TABLE "ApplicationFee" ADD CONSTRAINT "ApplicationFee_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationPayment" ADD CONSTRAINT "ApplicationPayment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationPayment" ADD CONSTRAINT "ApplicationPayment_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "ApplicationFee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationPayment" ADD CONSTRAINT "ApplicationPayment_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
