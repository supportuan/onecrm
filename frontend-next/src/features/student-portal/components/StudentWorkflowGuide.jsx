'use client';

import { CheckCircle2, Circle, Clock, FileText, CreditCard, UserCheck, GraduationCap, Plane } from 'lucide-react';
import { getStageLabel } from '@/features/student-crm/constants';
import { sp, StudentPortalPanel } from '../student-portal-ui';

const STEPS = [
  {
    id: 'documents',
    label: 'Upload documents',
    short: 'Documents',
    description: 'Upload all required documents for your application.',
    icon: FileText,
  },
  {
    id: 'payment',
    label: 'Pay application fee',
    short: 'Payment',
    description: 'Complete payment after all documents are uploaded.',
    icon: CreditCard,
  },
  {
    id: 'review',
    label: 'Counsellor review',
    short: 'Review',
    description: 'Your counsellor verifies documents and submits to the university.',
    icon: UserCheck,
  },
  {
    id: 'offer',
    label: 'Offer decision',
    short: 'Offer',
    description: 'Review and accept or decline your university offer.',
    icon: GraduationCap,
  },
  {
    id: 'visa',
    label: 'Visa & enrolment',
    short: 'Visa',
    description: 'Complete visa documents and pre-departure steps.',
    icon: Plane,
  },
];

export function resolveStudentWorkflow(app, readiness) {
  if (!app) {
    return { currentStepId: 'documents', steps: STEPS.map((s) => ({ ...s, status: 'pending' })), nextAction: null };
  }

  const docs = app.documents || [];
  const hasRejected = docs.some((d) => d.required && d.status === 'REJECTED');
  const docsUploaded = readiness?.documentsUploaded ?? false;
  const feesPaid = readiness?.feesPaid ?? false;
  const stage = app.stage || 'DOCUMENTS_PENDING';
  const offer = app.offerLetter;
  const offerPending = offer && (!offer.studentDecision || offer.studentDecision === 'PENDING');

  let currentStepId = 'documents';

  if (hasRejected || !docsUploaded) {
    currentStepId = 'documents';
  } else if (!feesPaid) {
    currentStepId = 'payment';
  } else if (stage === 'OFFER_RECEIVED' && offerPending) {
    currentStepId = 'offer';
  } else if (['OFFER_ACCEPTED', 'VISA_PROCESS', 'ENROLLED'].includes(stage)) {
    currentStepId = 'visa';
  } else if (['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'DRAFT'].includes(stage)) {
    currentStepId = 'review';
  } else if (stage === 'OFFER_REJECTED') {
    currentStepId = 'review';
  }

  const currentIdx = STEPS.findIndex((s) => s.id === currentStepId);

  const steps = STEPS.map((step, idx) => {
    let status = 'pending';
    if (idx < currentIdx) status = 'done';
    else if (idx === currentIdx) status = 'active';
    return { ...step, status };
  });

  let nextAction = null;
  if (currentStepId === 'documents') {
    const missing = readiness?.missingDocuments?.length
      ? readiness.missingDocuments
      : docs.filter((d) => d.required && d.status === 'PENDING').map((d) => d.name);
    if (hasRejected) {
      nextAction = {
        title: 'Re-upload rejected documents',
        detail: 'Some documents were rejected. Upload corrected files below.',
        tone: 'warning',
      };
    } else if (missing.length > 0) {
      nextAction = {
        title: `Upload ${missing.length} remaining document${missing.length === 1 ? '' : 's'}`,
        detail: missing.slice(0, 4).join(', ') + (missing.length > 4 ? '…' : ''),
        tone: 'action',
      };
    } else {
      nextAction = {
        title: 'Upload your documents',
        detail: 'Your counsellor assigned a checklist. Start uploading below.',
        tone: 'action',
      };
    }
  } else if (currentStepId === 'payment') {
    const unpaid = readiness?.unpaidFees || [];
    nextAction = {
      title: 'Pay your application fee',
      detail: unpaid.length ? `${unpaid[0].label} — ready to pay` : 'Complete payment to proceed.',
      tone: 'action',
    };
  } else if (currentStepId === 'review') {
    nextAction = {
      title: 'Waiting for counsellor',
      detail:
        stage === 'SUBMITTED' || stage === 'UNDER_REVIEW'
          ? `Application is ${getStageLabel(stage).toLowerCase()}. You will be notified of updates.`
          : 'Your counsellor is reviewing your documents. No action needed right now.',
      tone: 'wait',
    };
  } else if (currentStepId === 'offer') {
    nextAction = {
      title: 'Respond to your offer',
      detail: offer?.decisionDeadline
        ? `Please decide before ${new Date(offer.decisionDeadline).toLocaleDateString('en-IN')}.`
        : 'Review your offer letter and accept or decline.',
      tone: 'action',
    };
  } else if (currentStepId === 'visa') {
    nextAction = {
      title: stage === 'ENROLLED' ? 'Congratulations — enrolled' : 'Visa process in progress',
      detail: 'Follow visa checklist items and watch for counsellor updates.',
      tone: stage === 'ENROLLED' ? 'success' : 'wait',
    };
  }

  return { currentStepId, steps, nextAction };
}

const toneStyles = {
  action: 'border-neutral-200 bg-neutral-50 text-neutral-900',
  warning: 'border-amber-200/80 bg-amber-50 text-amber-950',
  wait: 'border-sky-200/80 bg-sky-50 text-sky-950',
  success: 'border-emerald-200/80 bg-emerald-50 text-emerald-950',
};

export default function StudentWorkflowGuide({ app, readiness, compact = false }) {
  const { steps, nextAction } = resolveStudentWorkflow(app, readiness);

  if (compact) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto pt-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const done = step.status === 'done';
          const active = step.status === 'active';
          return (
            <div
              key={step.id}
              className={`flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium border transition ${
                done
                  ? 'border-emerald-200/80 bg-emerald-50 text-emerald-800'
                  : active
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                    : 'border-neutral-200/80 bg-white text-neutral-400'
              }`}
            >
              {done ? <CheckCircle2 className="h-3 w-3" /> : active ? <Icon className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
              {step.short}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <StudentPortalPanel className={`${sp.panelPad} space-y-5`}>
      <div>
        <p className={sp.sectionEyebrow}>Progress</p>
        <h2 className={`${sp.sectionTitle} mt-1`}>Your application workflow</h2>
        <p className={`${sp.body} mt-1.5`}>Complete each step in order. Your counsellor handles university submission.</p>
      </div>

      {nextAction && (
        <div className={`rounded-xl border px-4 py-4 ${toneStyles[nextAction.tone] || toneStyles.wait}`}>
          <p className="text-sm font-semibold tracking-tight">{nextAction.title}</p>
          <p className="text-xs mt-1.5 leading-relaxed opacity-80">{nextAction.detail}</p>
        </div>
      )}

      <ol className="grid gap-3 sm:grid-cols-5">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const done = step.status === 'done';
          const active = step.status === 'active';
          return (
            <li
              key={step.id}
              className={`relative rounded-2xl border p-4 transition ${
                active
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-md ring-4 ring-neutral-900/5'
                  : done
                    ? 'border-emerald-200/80 bg-emerald-50/70'
                    : 'border-neutral-200/80 bg-neutral-50/40 text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : active ? (
                  <Icon className="h-4 w-4 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0" />
                )}
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] opacity-70">Step {idx + 1}</span>
              </div>
              <p className={`text-xs font-semibold leading-snug ${active ? 'text-white' : done ? 'text-emerald-900' : 'text-neutral-500'}`}>
                {step.label}
              </p>
              {active && (
                <p className="text-[10px] mt-2 leading-relaxed text-neutral-300">{step.description}</p>
              )}
            </li>
          );
        })}
      </ol>

      {nextAction?.tone === 'wait' && (
        <p className={`flex items-center gap-2 ${sp.body}`}>
          <Clock className="h-3.5 w-3.5 shrink-0" />
          You will receive a notification when the next step is ready.
        </p>
      )}
    </StudentPortalPanel>
  );
}
