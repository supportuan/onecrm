'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMyStudent, getFormOptions, updateMyStudent } from '@/services/studentCrmApi';
import { listIndustries, listIndustrySubFields } from '@/services/crmSettingsApi';
import { studyIdsFromProfile, toNumOrNull, toSelectId } from '@/features/student-crm/studyFormOptions';
import { resolveCatalogCountryId, pickCatalogCountry } from '@/features/student-crm/catalogCountry';
import CatalogCourseFields from '@/features/student-crm/components/CatalogCourseFields';
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
  universityId: '',
  university: '',
  courseId: '',
  course: '',
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
  const [countryIndustries, setCountryIndustries] = useState([]);
  const [subFields, setSubFields] = useState([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [loadingSubFields, setLoadingSubFields] = useState(false);
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
        const options = oRes?.data || { countries: [], industries: [] };
        setFormOptions(options);
        const ids = studyIdsFromProfile(p);
        const catalogCountryId = resolveCatalogCountryId(ids.countryId) || ids.countryId;
        const catalogCountry = pickCatalogCountry(options.countries, ids.countryId);
        setForm({
          ...emptyForm(),
          firstName: p?.firstName || '',
          lastName: p?.lastName || '',
          phone: p?.phone || '',
          email: p?.email || '',
          countryId: catalogCountryId,
          level: p?.level || '',
          industryId: ids.industryId,
          subIndustryId: ids.subIndustryId,
          studyAreaId: ids.studyAreaId,
          universityId: toSelectId(p?.preferredUniversityId ?? p?.preferredUniversity?.id),
          university: p?.preferredUniversity?.name || '',
          courseId: toSelectId(p?.preferredCourseId ?? p?.preferredCourseRef?.id),
          course: p?.preferredCourse || p?.preferredCourseRef?.name || '',
          intakeMonth: p?.intakeMonth || '',
          intakeYear: p?.intakeYear || '',
          studyMode: p?.studyMode || '',
          studyDuration: p?.studyDuration || '',
          studyBudget: p?.studyBudget || '',
          studyAttendanceType: p?.studyAttendanceType || '',
          typeOfDegree: p?.typeOfDegree || '',
          workExperience: p?.workExperience || '',
          preferredCountry: catalogCountry?.name || p?.preferredCountry || '',
        });
      })
      .catch(() => setMsg('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    const catalogCountryId = resolveCatalogCountryId(form?.countryId);
    if (!catalogCountryId) {
      setCountryIndustries([]);
      return;
    }
    setLoadingIndustries(true);
    listIndustries({ countryId: catalogCountryId })
      .then((r) => setCountryIndustries(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setCountryIndustries([]))
      .finally(() => setLoadingIndustries(false));
  }, [form?.countryId]);

  useEffect(() => {
    const catalogCountryId = resolveCatalogCountryId(form?.countryId);
    if (!catalogCountryId || !form?.industryId) {
      setSubFields([]);
      return;
    }
    setLoadingSubFields(true);
    listIndustrySubFields({ countryId: catalogCountryId, industryId: form.industryId })
      .then((r) => setSubFields(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setSubFields([]))
      .finally(() => setLoadingSubFields(false));
  }, [form?.countryId, form?.industryId]);

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
        preferredUniversityId: toNumOrNull(form.universityId),
        preferredCourseId: toNumOrNull(form.courseId),
        preferredCourse: form.course || null,
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
              <select
                className="ui-input ui-select"
                value={form.countryId}
                onChange={(e) => {
                  const country = formOptions.countries?.find((c) => String(c.catalogCountryId ?? c.id) === e.target.value);
                  setForm({
                    ...form,
                    countryId: e.target.value,
                    preferredCountry: country?.name || '',
                    industryId: '',
                    subIndustryId: '',
                    studyAreaId: '',
                    universityId: '',
                    university: '',
                    courseId: '',
                    course: '',
                  });
                }}
                required
              >
                <option value="">Select country</option>
                {formOptions.countries?.map((c) => (
                  <option key={c.id} value={String(c.catalogCountryId ?? c.id)}>
                    {c.name}
                    {c.courseCount > 0 ? ` (${c.courseCount.toLocaleString()} courses)` : ''}
                  </option>
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
            <Field label="Field of study" required>
              <select
                className="ui-input ui-select"
                value={form.industryId}
                onChange={(e) => setForm({ ...form, industryId: e.target.value, subIndustryId: '', studyAreaId: '' })}
                disabled={!form.countryId || loadingIndustries}
                required
              >
                <option value="">
                  {!form.countryId
                    ? 'Select country first'
                    : loadingIndustries
                      ? 'Loading fields…'
                      : countryIndustries.length
                        ? 'Select field of study'
                        : 'No fields for this country'}
                </option>
                {countryIndustries.map((i) => (
                  <option key={i.id ?? i.name} value={i.id ? String(i.id) : ''} disabled={!i.id}>
                    {i.name}
                    {i.courseCount != null ? ` (${i.courseCount.toLocaleString()} courses)` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Program level">
              <select
                className="ui-input ui-select"
                value={form.subIndustryId}
                onChange={(e) => {
                  const selected = subFields.find((s) => s.id && String(s.id) === e.target.value);
                  setForm({
                    ...form,
                    subIndustryId: e.target.value,
                    level: selected?.name || form.level,
                    studyAreaId: '',
                  });
                }}
                disabled={!form.industryId || loadingSubFields}
              >
                <option value="">
                  {!form.industryId
                    ? 'Select field of study first'
                    : loadingSubFields
                      ? 'Loading program levels…'
                      : subFields.length
                        ? 'Select program level'
                        : 'No program levels for this field'}
                </option>
                {subFields.map((s) => (
                  <option key={s.id ?? s.name} value={s.id ? String(s.id) : ''} disabled={!s.id}>
                    {s.name}
                    {s.courseCount != null ? ` (${s.courseCount.toLocaleString()} courses)` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <div className="md:col-span-2">
              <CatalogCourseFields
                hideCountry
                countryId={resolveCatalogCountryId(form.countryId) || form.countryId}
                countries={formOptions.countries}
                value={form}
                onChange={(catalog) => setForm((prev) => ({ ...prev, ...catalog }))}
              />
            </div>
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
