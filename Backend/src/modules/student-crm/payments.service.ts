import crypto from 'crypto';
import Razorpay from 'razorpay';
import { prisma } from '../../prisma.js';
import { safeNotify } from '../notifications/recipients.js';
import { getApplicationReadiness } from './application-gates.js';
import { getApplication } from './student-crm.service.js';

const getRazorpay = () => {
  const key_id = process.env.RAZORPAY_KEY_ID?.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!key_id || !key_secret) {
    throw new Error('Razorpay is not configured on the server');
  }
  return new Razorpay({ key_id, key_secret });
};

export const getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID?.trim() || null;

const feeIsPaid = async (feeId: number) => {
  const paid = await prisma.applicationPayment.findFirst({
    where: { feeId, status: 'PAID' },
  });
  return Boolean(paid);
};

export const listApplicationFees = async (applicationId: number) =>
  prisma.applicationFee.findMany({
    where: { applicationId },
    orderBy: { id: 'asc' },
    include: {
      payments: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

export const listMyPayments = async (studentUserId: number) =>
  prisma.applicationPayment.findMany({
    where: { studentUserId },
    orderBy: { createdAt: 'desc' },
    include: {
      application: {
        select: {
          id: true,
          applicationCode: true,
          university: true,
          course: true,
        },
      },
      fee: { select: { id: true, label: true, feeType: true } },
    },
  });

export const upsertApplicationFee = async (
  applicationId: number,
  data: {
    id?: number;
    feeType?: string;
    label: string;
    amountInr: number;
    required?: boolean;
    dueDate?: string | null;
  },
) => {
  const amountPaise = Math.round(Number(data.amountInr) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
    throw new Error('fee amount must be greater than zero');
  }

  const payload = {
    feeType: (data.feeType as any) || 'APPLICATION_FEE',
    label: data.label.trim(),
    amountPaise,
    required: data.required ?? true,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
  };

  if (data.id) {
    return prisma.applicationFee.update({
      where: { id: data.id },
      data: payload,
    });
  }

  return prisma.applicationFee.create({
    data: { applicationId, ...payload },
  });
};

export const seedDefaultApplicationFee = async (applicationId: number) => {
  const existing = await prisma.applicationFee.count({ where: { applicationId } });
  if (existing > 0) return;

  const defaultInr = Number(process.env.DEFAULT_APPLICATION_FEE_INR || '5000');
  if (!Number.isFinite(defaultInr) || defaultInr <= 0) return;

  await prisma.applicationFee.create({
    data: {
      applicationId,
      feeType: 'APPLICATION_FEE',
      label: 'Application processing fee',
      amountPaise: Math.round(defaultInr * 100),
      required: true,
    },
  });
};

export const createPaymentOrder = async (
  applicationId: number,
  feeId: number,
  studentUserId: number,
) => {
  const app = await getApplication(applicationId, { id: studentUserId, role: 'STUDENT' });
  if (!app) throw new Error('application not found');

  const fee = await prisma.applicationFee.findFirst({
    where: { id: feeId, applicationId },
  });
  if (!fee) throw new Error('fee not found');

  if (await feeIsPaid(feeId)) {
    throw new Error('this fee has already been paid');
  }

  const readiness = await getApplicationReadiness(applicationId);
  if (!readiness?.canPay) {
    throw new Error('upload all required documents before paying fees');
  }

  const razorpay = getRazorpay();
  // Razorpay receipt max length is 40 chars.
  const receipt = `CRM${applicationId}F${feeId}${Date.now().toString(36)}`.slice(0, 40);

  const order = await razorpay.orders.create({
    amount: fee.amountPaise,
    currency: fee.currency || 'INR',
    receipt,
    notes: {
      applicationId: String(applicationId),
      feeId: String(feeId),
      studentUserId: String(studentUserId),
    },
  });

  const payment = await prisma.applicationPayment.create({
    data: {
      applicationId,
      feeId,
      studentUserId,
      amountPaise: fee.amountPaise,
      currency: fee.currency || 'INR',
      status: 'CREATED',
      razorpayOrderId: order.id,
      metadata: { receipt },
    },
  });

  return {
    keyId: getRazorpayKeyId(),
    orderId: order.id,
    amount: fee.amountPaise,
    currency: fee.currency || 'INR',
    feeLabel: fee.label,
    paymentId: payment.id,
  };
};

export const verifyPayment = async (
  applicationId: number,
  studentUserId: number,
  data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
) => {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) throw new Error('Razorpay is not configured on the server');

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
    .digest('hex');

  if (expected !== data.razorpay_signature) {
    throw new Error('invalid payment signature');
  }

  const payment = await prisma.applicationPayment.findFirst({
    where: {
      applicationId,
      studentUserId,
      razorpayOrderId: data.razorpay_order_id,
    },
    include: {
      application: { include: { student: true, assignedTo: true } },
      fee: true,
    },
  });

  if (!payment) throw new Error('payment record not found');
  if (payment.status === 'PAID') {
    return { alreadyPaid: true, payment };
  }

  const receiptNumber = `RCPT-${applicationId}-${payment.id}`;

  const updated = await prisma.applicationPayment.update({
    where: { id: payment.id },
    data: {
      status: 'PAID',
      razorpayPaymentId: data.razorpay_payment_id,
      razorpaySignature: data.razorpay_signature,
      receiptNumber,
      paidAt: new Date(),
    },
    include: { fee: true },
  });

  await safeNotify({
    recipientId: studentUserId,
    templateKey: 'application.payment_received_student',
    vars: {
      applicationCode: payment.application.applicationCode,
      amount: (payment.amountPaise / 100).toFixed(2),
      feeLabel: payment.fee?.label || 'Application fee',
      applicationId,
      receiptNumber,
    },
  });

  if (payment.application.assignedToId) {
    await safeNotify({
      recipientId: payment.application.assignedToId,
      templateKey: 'application.payment_received',
      vars: {
        studentName: payment.application.student.fullName,
        applicationCode: payment.application.applicationCode,
        amount: (payment.amountPaise / 100).toFixed(2),
        feeLabel: payment.fee?.label || 'Application fee',
        applicationId,
      },
    });
  }

  return { alreadyPaid: false, payment: updated };
};
