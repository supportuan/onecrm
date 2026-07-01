'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { getMyStudent } from '@/services/studentCrmApi';
import { STAGE_LABELS } from '../constants';

export default function ProfileViewPage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyStudent()
      .then((r) => setProfile(r?.data || null))
      .catch((e) => setError(e.message || 'Failed to load profile'));
  }, []);

  if (error) return <p className="ui-error">{error}</p>;
  if (!profile) return <p className="text-sm text-neutral-500">Loading profile…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">My profile</h1>
          <p className="text-sm text-neutral-500 mt-1">Your personal and study details on file.</p>
        </div>
        {!profile.isEnrolled && (
          <Link href="/applicant/profile/edit" className="ui-btn-primary gap-2">
            <Pencil className="h-4 w-4" />
            Edit profile
          </Link>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Personal">
          <Row label="Name" value={profile.fullName} />
          <Row label="Email" value={profile.email} />
          <Row label="Phone" value={profile.phone} />
          <Row label="Nationality" value={profile.nationality} />
        </Card>
        <Card title="Study preferences">
          <Row label="Destination" value={profile.country?.name || profile.preferredCountry} />
          <Row label="Level" value={profile.level} />
          <Row label="Industry" value={profile.industry?.name} />
          <Row label="Sub-industry" value={profile.subIndustry?.name} />
          <Row label="Study area" value={profile.studyArea?.name} />
          <Row label="Intake" value={[profile.intakeMonth, profile.intakeYear].filter(Boolean).join(' ')} />
          <Row label="Study mode" value={profile.studyMode} />
          <Row label="Attendance" value={profile.studyAttendanceType} />
          <Row label="Budget" value={profile.studyBudget} />
          <Row label="Work experience" value={profile.workExperience} />
          <Row label="Process stage" value={STAGE_LABELS[profile.processStage] || profile.processStage} />
        </Card>
      </div>

      {Array.isArray(profile.educationDetails) && profile.educationDetails.length > 0 && (
        <Card title="Education background">
          <ul className="space-y-2">
            {profile.educationDetails.map((ed, i) => (
              <li key={i} className="text-sm text-neutral-700 flex justify-between gap-4 border-b border-neutral-100 pb-2 last:border-0">
                <span>{ed.label || ed.type}</span>
                <span className="text-neutral-500">{ed.grade || '—'} · {ed.passing_year || '—'}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="ui-panel p-5 space-y-3">
      <h2 className="text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm py-1">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-900 text-right font-medium">{value || '—'}</span>
    </div>
  );
}
