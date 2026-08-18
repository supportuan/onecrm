'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { studyIdsFromProfile, toNumOrNull } from '../studyFormOptions';
import { toDateInputValue } from '../dateFormat';

const STUDY_LEVELS = ['Certificate', 'Diploma', 'Bachelor', 'Master', 'PhD'];
const INTAKE_MONTHS = ['Spring', 'Summer', 'Fall', 'Winter', 'January', 'May', 'September'];
const INTAKE_YEARS = Array.from({ length: 8 }, (_, index) => String(new Date().getFullYear() + index));

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-brand focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-500';
const labelClass = 'text-[11px] font-medium uppercase tracking-wide text-neutral-500';
const panelClass = 'rounded-2xl border border-neutral-200 bg-white p-4 space-y-3';

const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const emptyEducation = () => ({ type: 'UG', label: '', passing_year: '', grade: '', medium: 'English' });
const emptyAcademic = () => ({ degree: '', institution: '', year: '', grade: '' });
const emptyExam = () => ({
  type: 'IELTS',
  label: '',
  overall_score: '',
  reading: '',
  writing: '',
  speaking: '',
  listening: '',
});

const Field = ({ label, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className={labelClass}>{label}</label>
    {children}
  </div>
);

const formFromStudent = (student) => {
  const ids = studyIdsFromProfile(student);
  const education = asArray(student?.educationDetails);
  const history = asArray(student?.academicHistory);
  const exams = asArray(student?.asstExamSections);
  return {
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    fullName: student?.fullName || '',
    email: student?.email || '',
    phone: student?.phone || '',
    dob: toDateInputValue(student?.dob),
    nationality: student?.nationality || '',
    preferredCountry: student?.preferredCountry || '',
    countryId: ids.countryId,
    industryId: ids.industryId,
    subIndustryId: ids.subIndustryId,
    studyAreaId: ids.studyAreaId,
    level: student?.level || '',
    intakeMonth: student?.intakeMonth || '',
    intakeYear: student?.intakeYear || '',
    workExperience: student?.workExperience || '',
    contactId: student?.contactId ?? '',
    ieltsScore: student?.ieltsScore ?? '',
    toeflScore: student?.toeflScore ?? '',
    greScore: student?.greScore ?? '',
    gmatScore: student?.gmatScore ?? '',
    educationDetails: education.length ? education.map((row) => ({ ...emptyEducation(), ...row })) : [emptyEducation()],
    academicHistory: history.length ? history.map((row) => ({ ...emptyAcademic(), ...row })) : [emptyAcademic()],
    asstExamSections: exams.length ? exams.map((row) => ({ ...emptyExam(), ...row })) : [emptyExam()],
  };
};

export default function StudentInfoPanel({
  student,
  canManage,
  counsellors = [],
  formOptions = {},
  onSave,
}) {
  const [form, setForm] = useState(() => formFromStudent(student));
  const [saving, setSaving] = useState(false);
  const locked = Boolean(student?.isEnrolled) || !canManage;

  useEffect(() => {
    setForm(formFromStudent(student));
  }, [student?.id, student?.updatedAt]);

  const countries = formOptions.countries || [];
  const industries = formOptions.industries || [];
  const selectedIndustry = industries.find((item) => String(item.id) === String(form.industryId || ''));
  const subjectOptions = useMemo(() => {
    if (selectedIndustry?.subIndustries?.length) return selectedIndustry.subIndustries;
    if (selectedIndustry?.studyAreas?.length) return selectedIndustry.studyAreas;
    return [];
  }, [selectedIndustry]);

  const patch = (next) => setForm((prev) => ({ ...prev, ...next }));
  const patchRow = (key, index, fields) =>
    setForm((prev) => {
      const list = [...(prev[key] || [])];
      list[index] = { ...list[index], ...fields };
      return { ...prev, [key]: list };
    });

  const save = async () => {
    if (locked || saving || !onSave) return;
    setSaving(true);
    try {
      await onSave({
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        fullName: form.fullName || null,
        phone: form.phone || null,
        dob: form.dob || null,
        nationality: form.nationality || null,
        preferredCountry: form.preferredCountry || null,
        level: form.level || null,
        countryId: toNumOrNull(form.countryId),
        industryId: toNumOrNull(form.industryId),
        subIndustryId: toNumOrNull(form.subIndustryId),
        studyAreaId: toNumOrNull(form.studyAreaId),
        intakeMonth: form.intakeMonth || null,
        intakeYear: form.intakeYear || null,
        workExperience: form.workExperience || null,
        contactId: form.contactId === '' ? null : Number(form.contactId),
        ieltsScore: form.ieltsScore === '' ? null : Number(form.ieltsScore),
        toeflScore: form.toeflScore === '' ? null : Number(form.toeflScore),
        greScore: form.greScore === '' ? null : Number(form.greScore),
        gmatScore: form.gmatScore === '' ? null : Number(form.gmatScore),
        educationDetails: (form.educationDetails || []).filter((row) => row.label || row.passing_year || row.grade),
        academicHistory: (form.academicHistory || []).filter(
          (row) => row.degree || row.institution || row.year || row.grade
        ),
        asstExamSections: (form.asstExamSections || []).filter(
          (row) => row.type || row.overall_score || row.label
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!student) {
    return <p className="text-sm text-neutral-500">No student is linked to this application yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className={panelClass}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-brand">Student profile</h4>
            <p className="mt-0.5 text-xs text-neutral-500">Prefilled from the student record.</p>
          </div>
          {canManage && !student.isEnrolled ? (
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="shrink-0 rounded-lg bg-brand px-5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-brand-hover disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Update'}
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="First name">
            <input className={inputClass} value={form.firstName} disabled={locked} onChange={(e) => patch({ firstName: e.target.value })} />
          </Field>
          <Field label="Last name">
            <input className={inputClass} value={form.lastName} disabled={locked} onChange={(e) => patch({ lastName: e.target.value })} />
          </Field>
          <Field label="Full name">
            <input className={inputClass} value={form.fullName} disabled={locked} onChange={(e) => patch({ fullName: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className={inputClass} value={form.email} disabled />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={form.phone} disabled={locked} onChange={(e) => patch({ phone: e.target.value })} />
          </Field>
          <Field label="Date of birth">
            <input type="date" className={inputClass} value={toDateInputValue(form.dob)} disabled={locked} onChange={(e) => patch({ dob: e.target.value })} />
          </Field>
          <Field label="Nationality">
            <input className={inputClass} value={form.nationality} disabled={locked} onChange={(e) => patch({ nationality: e.target.value })} />
          </Field>
          <Field label="Study destination">
            <select
              className={inputClass}
              value={form.countryId}
              disabled={locked}
              onChange={(e) => {
                const country = countries.find((item) => String(item.id) === e.target.value);
                patch({ countryId: e.target.value, preferredCountry: country?.name || '' });
              }}
            >
              <option value="">{form.preferredCountry || 'Select destination'}</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Study level">
            <select className={inputClass} value={form.level} disabled={locked} onChange={(e) => patch({ level: e.target.value })}>
              <option value="">Select level</option>
              {STUDY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Study industry">
            <select
              className={inputClass}
              value={form.industryId}
              disabled={locked}
              onChange={(e) => patch({ industryId: e.target.value, subIndustryId: '', studyAreaId: '' })}
            >
              <option value="">Select industry</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subject">
            <select
              className={inputClass}
              value={form.subIndustryId || form.studyAreaId || ''}
              disabled={locked}
              onChange={(e) => patch({ subIndustryId: e.target.value })}
            >
              <option value="">Select subject</option>
              {subjectOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Intake">
            <select className={inputClass} value={form.intakeMonth} disabled={locked} onChange={(e) => patch({ intakeMonth: e.target.value })}>
              <option value="">Select intake</option>
              {INTAKE_MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Intake year">
            <select className={inputClass} value={form.intakeYear} disabled={locked} onChange={(e) => patch({ intakeYear: e.target.value })}>
              <option value="">Select year</option>
              {INTAKE_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </Field>
          <Field label="POC">
            <select className={inputClass} value={form.contactId} disabled={locked} onChange={(e) => patch({ contactId: e.target.value })}>
              <option value="">Unassigned</option>
              {counsellors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Work experience" className="md:col-span-2">
            <input
              className={inputClass}
              value={form.workExperience}
              disabled={locked}
              onChange={(e) => patch({ workExperience: e.target.value })}
            />
          </Field>
        </div>
      </div>

      <div className={panelClass}>
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-brand">Education</h4>
          {!locked ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand"
              onClick={() => patch({ educationDetails: [...form.educationDetails, emptyEducation()] })}
            >
              <Plus size={12} /> Add qualification
            </button>
          ) : null}
        </div>
        {(form.educationDetails || []).map((row, index) => (
          <div key={`edu-${index}`} className="grid gap-3 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3 md:grid-cols-4">
            <Field label="Type">
              <select className={inputClass} value={row.type || 'UG'} disabled={locked} onChange={(e) => patchRow('educationDetails', index, { type: e.target.value })}>
                {['SSC', 'HSC', 'UG', 'PG'].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Qualification">
              <input className={inputClass} value={row.label || ''} disabled={locked} onChange={(e) => patchRow('educationDetails', index, { label: e.target.value })} />
            </Field>
            <Field label="Passing year">
              <input className={inputClass} value={row.passing_year || ''} disabled={locked} onChange={(e) => patchRow('educationDetails', index, { passing_year: e.target.value })} />
            </Field>
            <Field label="Grade">
              <div className="flex gap-2">
                <input className={inputClass} value={row.grade || ''} disabled={locked} onChange={(e) => patchRow('educationDetails', index, { grade: e.target.value })} />
                {!locked && form.educationDetails.length > 1 ? (
                  <button type="button" className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" onClick={() => patch({ educationDetails: form.educationDetails.filter((_, i) => i !== index) })}>
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
            </Field>
          </div>
        ))}

        <div className="flex items-center justify-between gap-3 pt-1">
          <h4 className="text-sm font-semibold text-brand">Academic history</h4>
          {!locked ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand"
              onClick={() => patch({ academicHistory: [...form.academicHistory, emptyAcademic()] })}
            >
              <Plus size={12} /> Add entry
            </button>
          ) : null}
        </div>
        {(form.academicHistory || []).map((row, index) => (
          <div key={`ac-${index}`} className="grid gap-3 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3 md:grid-cols-4">
            <Field label="Degree">
              <input className={inputClass} value={row.degree || ''} disabled={locked} onChange={(e) => patchRow('academicHistory', index, { degree: e.target.value })} />
            </Field>
            <Field label="Institution">
              <input className={inputClass} value={row.institution || ''} disabled={locked} onChange={(e) => patchRow('academicHistory', index, { institution: e.target.value })} />
            </Field>
            <Field label="Year">
              <input className={inputClass} value={row.year || ''} disabled={locked} onChange={(e) => patchRow('academicHistory', index, { year: e.target.value })} />
            </Field>
            <Field label="Grade">
              <div className="flex gap-2">
                <input className={inputClass} value={row.grade || ''} disabled={locked} onChange={(e) => patchRow('academicHistory', index, { grade: e.target.value })} />
                {!locked && form.academicHistory.length > 1 ? (
                  <button type="button" className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" onClick={() => patch({ academicHistory: form.academicHistory.filter((_, i) => i !== index) })}>
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
            </Field>
          </div>
        ))}
      </div>

      <div className={panelClass}>
        <h4 className="text-sm font-semibold text-brand">Test scores</h4>
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ['ieltsScore', 'IELTS'],
            ['toeflScore', 'TOEFL'],
            ['greScore', 'GRE'],
            ['gmatScore', 'GMAT'],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                type="number"
                step="0.5"
                className={inputClass}
                value={form[key]}
                disabled={locked}
                onChange={(e) => patch({ [key]: e.target.value })}
                placeholder="Score"
              />
            </Field>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <h4 className="text-sm font-semibold text-brand">Exam sections</h4>
          {!locked ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand"
              onClick={() => patch({ asstExamSections: [...form.asstExamSections, emptyExam()] })}
            >
              <Plus size={12} /> Add exam
            </button>
          ) : null}
        </div>
        {(form.asstExamSections || []).map((row, index) => (
          <div key={`ex-${index}`} className="grid gap-3 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3 md:grid-cols-3">
            <Field label="Exam">
              <input className={inputClass} value={row.type || ''} disabled={locked} onChange={(e) => patchRow('asstExamSections', index, { type: e.target.value })} />
            </Field>
            <Field label="Overall">
              <input className={inputClass} value={row.overall_score || ''} disabled={locked} onChange={(e) => patchRow('asstExamSections', index, { overall_score: e.target.value })} />
            </Field>
            <Field label="Reading">
              <div className="flex gap-2">
                <input className={inputClass} value={row.reading || ''} disabled={locked} onChange={(e) => patchRow('asstExamSections', index, { reading: e.target.value })} />
                {!locked && form.asstExamSections.length > 1 ? (
                  <button type="button" className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" onClick={() => patch({ asstExamSections: form.asstExamSections.filter((_, i) => i !== index) })}>
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
            </Field>
            <Field label="Writing">
              <input className={inputClass} value={row.writing || ''} disabled={locked} onChange={(e) => patchRow('asstExamSections', index, { writing: e.target.value })} />
            </Field>
            <Field label="Speaking">
              <input className={inputClass} value={row.speaking || ''} disabled={locked} onChange={(e) => patchRow('asstExamSections', index, { speaking: e.target.value })} />
            </Field>
            <Field label="Listening">
              <input className={inputClass} value={row.listening || ''} disabled={locked} onChange={(e) => patchRow('asstExamSections', index, { listening: e.target.value })} />
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}
