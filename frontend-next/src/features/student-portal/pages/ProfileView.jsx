'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Loader2, Mail } from 'lucide-react';
import { getMyStudent, uploadMyProfilePhoto } from '@/services/studentCrmApi';
import { initials } from '@/lib/layout-shell';
import { STAGE_LABELS } from '../constants';
import { notifyProfilePhotoUpdated } from '../components/StudentAvatarLink';
import { StudentPageHeader } from '../layout/StudentPortalLayoutContext';
import {
  sp,
  StudentPortalPage,
  StudentPortalPanel,
  ProgressBar,
  SkeletonBlock,
} from '../student-portal-ui';

const formatDob = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return null;
  }
};

const PROFILE_FIELDS = [
  { key: 'fullName', label: 'Full name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'dob', label: 'Date of birth' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'preferredCountry', label: 'Destination', get: (p) => p.country?.name || p.preferredCountry },
  { key: 'level', label: 'Level' },
  { key: 'intake', label: 'Intake', get: (p) => [p.intakeMonth, p.intakeYear].filter(Boolean).join(' ') },
];

export default function ProfileViewPage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    getMyStudent()
      .then((r) => setProfile(r?.data || null))
      .catch((e) => setError(e.message || 'Failed to load profile'));
  }, []);

  const completion = useMemo(() => {
    if (!profile) return 0;
    const filled = PROFILE_FIELDS.filter((f) => {
      const v = f.get ? f.get(profile) : profile[f.key];
      return v != null && String(v).trim() !== '';
    }).length;
    const extras = [
      Array.isArray(profile.academicHistory) && profile.academicHistory.length > 0,
      Array.isArray(profile.educationDetails) && profile.educationDetails.length > 0,
      profile.ieltsScore != null ||
        profile.toeflScore != null ||
        (Array.isArray(profile.asstExamSections) && profile.asstExamSections.length > 0),
      Boolean(profile.profilePhotoUrl),
    ].filter(Boolean).length;
    const total = PROFILE_FIELDS.length + 4;
    return Math.round(((filled + extras) / total) * 100);
  }, [profile]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const res = await uploadMyProfilePhoto(file);
      const next = res?.data || null;
      if (next) setProfile(next);
      notifyProfilePhotoUpdated(next?.profilePhotoUrl || null);
    } catch (err) {
      setUploadError(err?.message || 'Could not upload photo');
    } finally {
      setUploading(false);
    }
  };

  if (error) {
    return (
      <StudentPortalPage>
        <div className={`${sp.empty} border-rose-200 bg-rose-50 text-rose-700`}>{error}</div>
      </StudentPortalPage>
    );
  }

  if (!profile) {
    return (
      <StudentPortalPage>
        <SkeletonBlock className="h-28" />
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonBlock className="h-64" />
          <SkeletonBlock className="h-64" />
        </div>
      </StudentPortalPage>
    );
  }

  const examScores = [
    profile.ieltsScore != null && { label: 'IELTS', value: profile.ieltsScore },
    profile.toeflScore != null && { label: 'TOEFL', value: profile.toeflScore },
    profile.greScore != null && { label: 'GRE', value: profile.greScore },
    profile.gmatScore != null && { label: 'GMAT', value: profile.gmatScore },
  ].filter(Boolean);

  const missingHints = PROFILE_FIELDS.filter((f) => {
    const v = f.get ? f.get(profile) : profile[f.key];
    return v == null || String(v).trim() === '';
  }).map((f) => f.label);

  return (
    <StudentPortalPage>
      <StudentPageHeader
        title="Profile"
        description="Upload your photo anytime. Other details are managed by your counsellor — contact them to request changes."
      />

      <StudentPortalPanel className={`${sp.panelPad} flex flex-col gap-5 sm:flex-row sm:items-center`}>
        <div className="relative shrink-0">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-xl font-semibold text-brand">
            {profile.profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profilePhotoUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <span
              className="h-full w-full items-center justify-center"
              style={{ display: profile.profilePhotoUrl ? 'none' : 'flex' }}
              aria-hidden
            >
              {initials(profile.fullName, profile.email)}
            </span>
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white bg-brand text-white shadow-sm transition hover:bg-brand-hover disabled:opacity-60"
            aria-label={profile.profilePhotoUrl ? 'Replace profile photo' : 'Upload profile photo'}
            title={profile.profilePhotoUrl ? 'Replace photo' : 'Upload photo'}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-lg font-semibold tracking-tight text-brand">{profile.fullName}</p>
          <p className={sp.body}>{profile.email}</p>
          <p className="text-xs text-slate-400">
            JPG, PNG or WebP · max 5MB. This photo appears in the top bar avatar.
          </p>
          {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className={sp.btnGhost}
        >
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Camera className="h-3.5 w-3.5" />
              {profile.profilePhotoUrl ? 'Replace photo' : 'Upload photo'}
            </>
          )}
        </button>
      </StudentPortalPanel>

      <StudentPortalPanel className={`${sp.panelPad} space-y-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={sp.sectionEyebrow}>Completeness</p>
            <h2 className={`${sp.sectionTitle} mt-1`}>Profile completion</h2>
            {missingHints.length > 0 && (
              <p className={`${sp.body} mt-1.5`}>
                Still missing: {missingHints.slice(0, 4).join(', ')}
                {missingHints.length > 4 ? '…' : ''}. Ask your counsellor to update these.
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold text-brand">{completion}%</p>
          </div>
        </div>
        <ProgressBar value={completion} tone={completion >= 80 ? 'emerald' : completion >= 50 ? 'brand' : 'amber'} />
      </StudentPortalPanel>

      {profile.contact?.fullName && (
        <StudentPortalPanel className={`${sp.panelPad} flex flex-wrap items-center justify-between gap-4`}>
          <div>
            <p className={sp.sectionEyebrow}>Assigned counsellor</p>
            <p className="mt-1 text-base font-semibold text-brand">{profile.contact.fullName}</p>
            {profile.contact.email && <p className={`${sp.body} mt-0.5`}>{profile.contact.email}</p>}
          </div>
          {profile.contact.email && (
            <a href={`mailto:${profile.contact.email}`} className={sp.btnGhost}>
              <Mail size={14} /> Contact counsellor
            </a>
          )}
        </StudentPortalPanel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Personal information">
          <Row label="Full name" value={profile.fullName} />
          <Row label="Email" value={profile.email} />
          <Row label="Phone" value={profile.phone} />
          <Row label="Date of birth" value={formatDob(profile.dob)} />
          <Row label="Nationality" value={profile.nationality} />
        </Card>
        <Card title="Study preferences">
          <Row label="Destination" value={profile.country?.name || profile.preferredCountry} />
          <Row label="Level" value={profile.level} />
          <Row label="Industry" value={profile.industry?.name} />
          <Row label="Sub-industry" value={profile.subIndustry?.name} />
          <Row label="Study area" value={profile.studyArea?.name} />
          <Row label="Preferred university" value={profile.preferredUniversity?.name} />
          <Row label="Preferred course" value={profile.preferredCourseRef?.name || profile.preferredCourse} />
          <Row label="Intake" value={[profile.intakeMonth, profile.intakeYear].filter(Boolean).join(' ')} />
          <Row label="Study mode" value={profile.studyMode} />
          <Row label="Attendance" value={profile.studyAttendanceType} />
          <Row label="Budget" value={profile.studyBudget} />
          <Row label="Work experience" value={profile.workExperience} />
          <Row label="Process stage" value={STAGE_LABELS[profile.processStage] || profile.processStage} />
        </Card>
      </div>

      {(examScores.length > 0 || (Array.isArray(profile.asstExamSections) && profile.asstExamSections.length > 0)) && (
        <Card title="English & entrance test scores">
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
        <Card title="Academic qualifications">
          <ul className="space-y-3">
            {profile.academicHistory.map((row, i) => (
              <li
                key={i}
                className="flex justify-between gap-4 border-b border-neutral-100 pb-3 text-sm last:border-0 last:pb-0"
              >
                <span className="text-neutral-700">
                  {row.degree || '—'}
                  {row.institution ? ` · ${row.institution}` : ''}
                  {row.backlogs != null && row.backlogs !== '' ? ` · Backlogs: ${row.backlogs}` : ''}
                </span>
                <span className="shrink-0 text-neutral-400">
                  {row.grade || row.gpa || '—'} · {row.year || row.graduationYear || '—'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {Array.isArray(profile.educationDetails) && profile.educationDetails.length > 0 && (
        <Card title="Education background">
          <ul className="space-y-3">
            {profile.educationDetails.map((ed, i) => (
              <li
                key={i}
                className="flex justify-between gap-4 border-b border-neutral-100 pb-3 text-sm last:border-0 last:pb-0"
              >
                <span className="text-neutral-700">{ed.label || ed.type}</span>
                <span className="shrink-0 text-neutral-400">
                  {ed.grade || '—'} · {ed.passing_year || '—'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!examScores.length &&
        !(Array.isArray(profile.asstExamSections) && profile.asstExamSections.length) &&
        !(Array.isArray(profile.academicHistory) && profile.academicHistory.length) &&
        !(Array.isArray(profile.educationDetails) && profile.educationDetails.length) && (
          <div className={sp.empty}>
            Academic history and test scores have not been added yet. Your counsellor will update these.
          </div>
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
    <div className="flex justify-between gap-4 py-0.5 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right font-medium text-brand">{value || '—'}</span>
    </div>
  );
}
