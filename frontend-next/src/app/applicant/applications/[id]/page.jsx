'use client';

import { use } from 'react';
import StudentApplicationDetail from '@/features/student-portal/pages/StudentApplicationDetail';

export default function ApplicantApplicationDetailPage({ params }) {
  const { id } = use(params);
  return <StudentApplicationDetail applicationId={id} />;
}
