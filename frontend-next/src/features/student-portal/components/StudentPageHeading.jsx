'use client';

import { usePathname } from 'next/navigation';

export function getStudentPageMeta(pathname = '') {
  let title = '';
  let description = '';

  if (pathname.startsWith('/applicant/profile/edit')) {
    title = 'Edit Profile';
    description = 'Update your personal details.';
  } else if (pathname.startsWith('/applicant/profile/view')) {
    title = 'Profile';
    description = 'Your personal and academic details.';
  } else if (pathname.startsWith('/applicant/messages')) {
    title = 'Messages';
    description = 'Chat with your counsellor about applications and next steps.';
  } else if (pathname.startsWith('/applicant/resources')) {
    title = 'Knowledge Hub';
  } else if (/\/applicant\/payments\/\d+\/receipt/.test(pathname)) {
    title = 'Payment Receipt';
  } else if (pathname.startsWith('/applicant/payments')) {
    title = 'Payments';
    description = 'Track fee payments and download receipts.';
  } else if (/\/applicant\/applications\/\d+/.test(pathname)) {
    title = 'Application Details';
  } else if (pathname.startsWith('/applicant/applications')) {
    title = 'Applications';
    description = 'Upload documents, pay fees, then your counsellor handles university submission.';
  }

  return { title, description };
}

export default function StudentAutoPageHeading() {
  const pathname = usePathname() || '';
  const { title, description } = getStudentPageMeta(pathname);

  if (!title) return null;

  return (
    <header className="mb-4 space-y-0.5">
      <h1 className="app-title-gradient text-[var(--type-page-title)] font-semibold leading-tight tracking-tight">
        {title}
      </h1>
      {description ? (
        <p className="app-shell-tagline max-w-2xl">{description}</p>
      ) : null}
    </header>
  );
}
