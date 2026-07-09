import { prisma } from '../../prisma.js';

export type ApplicationReadiness = {
  documentsUploaded: boolean;
  documentsVerified: boolean;
  feesPaid: boolean;
  canPay: boolean;
  canSubmit: boolean;
  missingDocuments: string[];
  unpaidFees: { id: number; label: string; amountPaise: number }[];
};

export const getApplicationReadiness = async (
  applicationId: number,
): Promise<ApplicationReadiness | null> => {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      documents: true,
      fees: true,
      payments: { where: { status: 'PAID' } },
    },
  });
  if (!app) return null;

  const requiredDocs = app.documents.filter((d) => d.required);
  const documentsUploaded =
    requiredDocs.length === 0 ||
    requiredDocs.every((d) => ['UPLOADED', 'VERIFIED'].includes(d.status));
  const documentsVerified =
    requiredDocs.length === 0 || requiredDocs.every((d) => d.status === 'VERIFIED');

  const paidFeeIds = new Set(app.payments.map((p) => p.feeId).filter((id): id is number => id != null));
  const requiredFees = app.fees.filter((f) => f.required);
  const feesPaid =
    requiredFees.length === 0 || requiredFees.every((f) => paidFeeIds.has(f.id));

  const unpaidFees = requiredFees
    .filter((f) => !paidFeeIds.has(f.id))
    .map((f) => ({ id: f.id, label: f.label, amountPaise: f.amountPaise }));

  const missingDocuments = requiredDocs
    .filter((d) => !['UPLOADED', 'VERIFIED'].includes(d.status))
    .map((d) => d.name);

  return {
    documentsUploaded,
    documentsVerified,
    feesPaid,
    canPay: documentsUploaded,
    canSubmit: documentsVerified && feesPaid,
    missingDocuments,
    unpaidFees,
  };
};

export const assertStageAdvanceAllowed = async (
  applicationId: number,
  toStage: string,
): Promise<void> => {
  if (!['SUBMITTED', 'UNDER_REVIEW', 'OFFER_RECEIVED'].includes(toStage)) return;

  const readiness = await getApplicationReadiness(applicationId);
  if (!readiness) throw new Error('application not found');

  if (!readiness.documentsVerified) {
    throw new Error('Cannot advance: all required documents must be verified first');
  }

  if (['SUBMITTED', 'UNDER_REVIEW'].includes(toStage) && !readiness.feesPaid) {
    throw new Error('Cannot advance: application fee must be paid first');
  }
};
