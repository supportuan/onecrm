'use client';

import { useEffect, useState } from 'react';
import { getMyStudent } from '@/services/studentCrmApi';
import { STAGE_LABELS } from '../constants';
import { StudentPageHeader } from '../layout/StudentPortalLayoutContext';
import { sp, StudentPortalPage, StudentPortalPanel } from '../student-portal-ui';

export default function ProfileViewPage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyStudent()
      .then((r) => setProfile(r?.data || null))
      .catch((e) => setError(e.message || 'Failed to load profile'));
  }, []);

  if (error) return <p className="ui-error">{error}</p>;
  if (!profile) {
    return (
      <StudentPortalPage>
        <p className={sp.body}>Loading profile…</p>
      </StudentPortalPage>
    );
  }

  const examScores = [
    profile.ieltsScore != null && { label: 'IELTS', value: profile.ieltsScore },
    profile.toeflScore != null && { label: 'TOEFL', value: profile.toeflScore },
    profile.greScore != null && { label: 'GRE', value: profile.greScore },
    profile.gmatScore != null && { label: 'GMAT', value: profile.gmatScore },
  ].filter(Boolean);

  return (
    <StudentPortalPage>
      <StudentPageHeader
        title="Profile"
        description="View-only. Your counsellor maintains these details — contact them to request changes."
      />

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

      {(examScores.length > 0 || (Array.isArray(profile.asstExamSections) && profile.asstExamSections.length > 0)) && (
        <Card title="Exam scores">
          {examScores.map((s) => (
            <Row key={s.label} label={s.label} value={s.value} />
          ))}
          {Array.isArray(profile.asstExamSections) &&
            profile.asstExamSections.map((ex, i) => (
              <Row
                key={i}
                label={ex.label || ex.type || `Exam ${i + 1}`}
                value={
                  ex.overall_score
                    ? `${ex.overall_score}${ex.reading ? ` (R:${ex.reading} W:${ex.writing} S:${ex.speaking} L:${ex.listening})` : ''}`
                    : '—'
                }
              />
            ))}
        </Card>
      )}

      {Array.isArray(profile.academicHistory) && profile.academicHistory.length > 0 && (
        <Card title="Academic history">
          <ul className="space-y-3">
            {profile.academicHistory.map((row, i) => (
              <li key={i} className="flex justify-between gap-4 text-sm border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                <span className="text-neutral-700">{row.degree || '—'}{row.institution ? ` · ${row.institution}` : ''}</span>
                <span className="text-neutral-400 shrink-0">{row.grade || '—'} · {row.year || '—'}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {Array.isArray(profile.educationDetails) && profile.educationDetails.length > 0 && (
        <Card title="Education background">
          <ul className="space-y-3">
            {profile.educationDetails.map((ed, i) => (
              <li key={i} className="flex justify-between gap-4 text-sm border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                <span className="text-neutral-700">{ed.label || ed.type}</span>
                <span className="text-neutral-400 shrink-0">{ed.grade || '—'} · {ed.passing_year || '—'}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </StudentPortalPage>
  );
}

function Card({ title, children }) {
  return (
    <StudentPortalPanel className={`${sp.panelPad} space-y-4`}>
      <h2 className={`${sp.sectionTitle} border-b border-neutral-100 pb-3`}>{title}</h2>
      {children}
    </StudentPortalPanel>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm py-0.5">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-900 text-right font-medium">{value || '—'}</span>
    </div>
  );
}
