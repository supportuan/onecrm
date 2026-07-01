'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMyStudent, getFormOptions, updateMyStudent } from '@/services/studentCrmApi';
import { resolveStudyCascades, studyIdsFromProfile, toNumOrNull, toSelectId } from '@/features/student-crm/studyFormOptions';
import {
  LEVELS,
  INTAKE_MONTHS,
  STUDY_MODES,
  ATTENDANCE_TYPES,
  BUDGET_OPTIONS,
  WORK_EXPERIENCE_OPTIONS,
} from '../constants';

const emptyForm = () => ({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  countryId: '',
  level: '',
  industryId: '',
  subIndustryId: '',
  studyAreaId: '',
  intakeMonth: '',
  intakeYear: '',
  studyMode: '',
  studyDuration: '',
  studyBudget: '',
  studyAttendanceType: '',
  typeOfDegree: '',
  workExperience: '',
});

export default function ProfileEditPage() {
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [formOptions, setFormOptions] = useState({ countries: [], industries: [] });
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyStudent(), getFormOptions()])
      .then(([pRes, oRes]) => {
        const p = pRes?.data;
        if (p?.isEnrolled) {
          router.replace('/applicant/profile/view');
          return;
        }
        setFormOptions(oRes?.data || { countries: [], industries: [] });
        const ids = studyIdsFromProfile(p);
        setForm({
          ...emptyForm(),
          firstName: p?.firstName || '',
          lastName: p?.lastName || '',
          phone: p?.phone || '',
          email: p?.email || '',
          countryId: ids.countryId,
          level: p?.level || '',
          industryId: ids.industryId,
          subIndustryId: ids.subIndustryId,
          studyAreaId: ids.studyAreaId,
          intakeMonth: p?.intakeMonth || '',
          intakeYear: p?.intakeYear || '',
          studyMode: p?.studyMode || '',
          studyDuration: p?.studyDuration || '',
          studyBudget: p?.studyBudget || '',
          studyAttendanceType: p?.studyAttendanceType || '',
          typeOfDegree: p?.typeOfDegree || '',
          workExperience: p?.workExperience || '',
        });
      })
      .catch(() => setMsg('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [router]);

  const { subIndustries, studyAreas } = useMemo(
    () => resolveStudyCascades(formOptions.industries, form?.industryId, form?.subIndustryId),
    [formOptions.industries, form?.industryId, form?.subIndustryId]
  );
  const showGraduationFields = (form?.level || '').toLowerCase().includes('graduation') || form?.level === 'PG';

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await updateMyStudent({
        ...form,
        countryId: toNumOrNull(form.countryId),
        industryId: toNumOrNull(form.industryId),
        subIndustryId: toNumOrNull(form.subIndustryId),
        studyAreaId: toNumOrNull(form.studyAreaId),
      });
      router.push('/applicant/profile/view');
    } catch (err) {
      setMsg(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading profile…</p>;
  }
  if (!form) {
    return <p className="ui-error">{msg || 'Could not load profile'}</p>;
  }

  const yearOptions = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() + i));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Edit profile</h1>
          <p className="text-sm text-neutral-500 mt-1">Update your personal details and study preferences.</p>
        </div>
        <Link href="/applicant/profile/view" className="ui-btn-secondary">
          Cancel
        </Link>
      </div>

      <form onSubmit={save} className="space-y-6">
        <section className="ui-panel p-6 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900">Personal details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="First name" required>
              <input className="ui-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </Field>
            <Field label="Last name" required>
              <input className="ui-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </Field>
            <Field label="Phone" required>
              <input className="ui-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </Field>
            <Field label="Email">
              <input className="ui-input bg-neutral-50 text-neutral-500" value={form.email} readOnly />
            </Field>
          </div>
        </section>

        <section className="ui-panel p-6 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900">Study preferences</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Study destination" required>
              <select className="ui-input ui-select" value={form.countryId} onChange={(e) => setForm({ ...form, countryId: e.target.value })} required>
                <option value="">Select country</option>
                {formOptions.countries?.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Study level" required>
              <select className="ui-input ui-select" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} required>
                <option value="">Select level</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Industry" required>
              <select
                className="ui-input ui-select"
                value={form.industryId}
                onChange={(e) => setForm({ ...form, industryId: e.target.value, subIndustryId: '', studyAreaId: '' })}
                required
              >
                <option value="">Select industry</option>
                {formOptions.industries?.map((i) => (
                  <option key={i.id} value={String(i.id)}>{i.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Sub-industry">
              <select
                className="ui-input ui-select"
                value={form.subIndustryId}
                onChange={(e) => setForm({ ...form, subIndustryId: e.target.value, studyAreaId: '' })}
                disabled={!subIndustries.length}
              >
                <option value="">{subIndustries.length ? 'Select sub-industry' : 'No sub-industries'}</option>
                {subIndustries.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Study area">
              <select
                className="ui-input ui-select"
                value={form.studyAreaId}
                onChange={(e) => setForm({ ...form, studyAreaId: e.target.value })}
                disabled={!studyAreas.length}
              >
                <option value="">{studyAreas.length ? 'Select study area' : 'No study areas'}</option>
                {studyAreas.map((a) => (
                  <option key={a.id} value={String(a.id)}>{a.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Budget" required>
              <select className="ui-input ui-select" value={form.studyBudget} onChange={(e) => setForm({ ...form, studyBudget: e.target.value })} required>
                <option value="">Select budget</option>
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Intake month" required>
              <select className="ui-input ui-select" value={form.intakeMonth} onChange={(e) => setForm({ ...form, intakeMonth: e.target.value })} required>
                <option value="">Select month</option>
                {INTAKE_MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Intake year" required>
              <select className="ui-input ui-select" value={form.intakeYear} onChange={(e) => setForm({ ...form, intakeYear: e.target.value })} required>
                <option value="">Select year</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </Field>
            <Field label="Study mode" required>
              <select className="ui-input ui-select" value={form.studyMode} onChange={(e) => setForm({ ...form, studyMode: e.target.value })} required>
                <option value="">Select mode</option>
                {STUDY_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Attendance type" required>
              <select className="ui-input ui-select" value={form.studyAttendanceType} onChange={(e) => setForm({ ...form, studyAttendanceType: e.target.value })} required>
                <option value="">Select type</option>
                {ATTENDANCE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            {showGraduationFields && (
              <>
                <Field label="Duration">
                  <input className="ui-input" value={form.studyDuration} onChange={(e) => setForm({ ...form, studyDuration: e.target.value })} placeholder="e.g. 2 years" />
                </Field>
                <Field label="Type of degree">
                  <input className="ui-input" value={form.typeOfDegree} onChange={(e) => setForm({ ...form, typeOfDegree: e.target.value })} />
                </Field>
              </>
            )}
            <Field label="Work experience" required>
              <select className="ui-input ui-select" value={form.workExperience} onChange={(e) => setForm({ ...form, workExperience: e.target.value })} required>
                <option value="">Select experience</option>
                {WORK_EXPERIENCE_OPTIONS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {msg && <p className="ui-error">{msg}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="ui-btn-primary">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <Link href="/applicant/profile/view" className="ui-btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="ui-label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
