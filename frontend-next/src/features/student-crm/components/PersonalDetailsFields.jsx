'use client';

import { Plus, Trash2 } from 'lucide-react';
import { toNumOrNull } from '../studyFormOptions';
import RequiredStatusIcon, { isFilledValue } from './RequiredStatusIcon';
import { INTAKE_MONTHS, STUDY_LEVELS, intakeYears } from '../studentFormOptions';

const INTAKE_YEARS = intakeYears();

const FilledField = ({ label, children, required = false, filled = false }) => (
  <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5">
    <span className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
      {required ? <RequiredStatusIcon submitted={filled} /> : null}
      {label}
    </span>
    <div className="mt-0.5">{children}</div>
  </div>
);

const FILLED_INPUT =
  'w-full bg-transparent text-sm font-medium text-neutral-800 outline-none placeholder:text-neutral-400 disabled:text-neutral-500';
const FILLED_SELECT = `${FILLED_INPUT} appearance-none cursor-pointer bg-[length:16px] bg-[right_0px_center] bg-no-repeat pr-6`;
const FILLED_SELECT_BG = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
};

export const emptyExam = () => ({
  type: 'IELTS',
  label: '',
  overall_score: '',
  reading: '',
  writing: '',
  speaking: '',
  listening: '',
});

export const emptyPersonalForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  preferredCountry: '',
  countryId: '',
  level: '',
  industryId: '',
  subIndustryId: '',
  studyAreaId: '',
  intakeMonth: '',
  intakeYear: '',
  contactId: '',
  ieltsScore: '',
  toeflScore: '',
  greScore: '',
  gmatScore: '',
  asstExamSections: [emptyExam()],
});

const scoreOrNull = (value) => (value === '' || value == null ? null : Number(value));

export const personalFormToStudentPayload = (form) => {
  const fullName = [form.firstName, form.lastName].filter(Boolean).join(' ').trim();
  return {
    firstName: form.firstName || null,
    lastName: form.lastName || null,
    fullName,
    email: form.email,
    phone: form.phone || null,
    preferredCountry: form.preferredCountry || null,
    level: form.level || null,
    countryId: toNumOrNull(form.countryId),
    industryId: toNumOrNull(form.industryId),
    subIndustryId: toNumOrNull(form.subIndustryId),
    studyAreaId: toNumOrNull(form.studyAreaId),
    intakeMonth: form.intakeMonth || null,
    intakeYear: form.intakeYear || null,
    contactId: form.contactId === '' ? null : Number(form.contactId),
    ieltsScore: scoreOrNull(form.ieltsScore),
    toeflScore: scoreOrNull(form.toeflScore),
    greScore: scoreOrNull(form.greScore),
    gmatScore: scoreOrNull(form.gmatScore),
    asstExamSections: (form.asstExamSections || []).filter(
      (row) => row.type || row.overall_score || row.label || row.reading || row.writing || row.speaking || row.listening
    ),
    academicHistory: [],
  };
};

/** Personal details (student info step 1) — used by the profile tab and New student modal. */
export default function PersonalDetailsFields({
  form,
  onChange,
  countries = [],
  industries = [],
  counsellors = [],
  locked = false,
  phoneLocked = false,
  emailLocked = false,
  requireIdentity = false,
}) {
  const selectedIndustry = industries.find((item) => String(item.id) === String(form.industryId || ''));
  const subjectOptions = selectedIndustry?.subIndustries?.length
    ? selectedIndustry.subIndustries
    : selectedIndustry?.studyAreas || [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FilledField label="First Name" required={requireIdentity} filled={isFilledValue(form.firstName)}>
            <input
              required={requireIdentity}
              className={FILLED_INPUT}
              value={form.firstName}
              disabled={locked}
              onChange={(e) => onChange({ firstName: e.target.value })}
            />
          </FilledField>
          <FilledField label="Last Name" required={requireIdentity} filled={isFilledValue(form.lastName)}>
            <input
              required={requireIdentity}
              className={FILLED_INPUT}
              value={form.lastName}
              disabled={locked}
              onChange={(e) => onChange({ lastName: e.target.value })}
            />
          </FilledField>
        </div>

        <FilledField label="Phone Number">
          <input
            className={FILLED_INPUT}
            value={form.phone}
            disabled={phoneLocked}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </FilledField>

        <FilledField label="Email" required={requireIdentity} filled={isFilledValue(form.email)}>
          <input
            required={requireIdentity}
            type="email"
            className={FILLED_INPUT}
            value={form.email}
            disabled={emailLocked}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </FilledField>

        <FilledField label="Study Destination">
          <select
            className={FILLED_SELECT}
            style={FILLED_SELECT_BG}
            value={form.countryId}
            disabled={locked}
            onChange={(e) => {
              const country = countries.find((item) => String(item.id) === e.target.value);
              onChange({
                countryId: e.target.value,
                preferredCountry: country?.name || '',
              });
            }}
          >
            <option value="">Select destination</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </FilledField>

        <FilledField label="Study Level">
          <select
            className={FILLED_SELECT}
            style={FILLED_SELECT_BG}
            value={form.level}
            disabled={locked}
            onChange={(e) => onChange({ level: e.target.value })}
          >
            <option value="">Select level</option>
            {STUDY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </FilledField>
      </div>

      <div className="space-y-4">
        <FilledField label="Study Industry">
          <select
            className={FILLED_SELECT}
            style={FILLED_SELECT_BG}
            value={form.industryId}
            disabled={locked}
            onChange={(e) =>
              onChange({
                industryId: e.target.value,
                subIndustryId: '',
                studyAreaId: '',
              })
            }
          >
            <option value="">Select industry</option>
            {industries.map((industry) => (
              <option key={industry.id} value={industry.id}>
                {industry.name}
              </option>
            ))}
          </select>
        </FilledField>

        <FilledField label="Subject Industry">
          <select
            className={FILLED_SELECT}
            style={FILLED_SELECT_BG}
            value={form.subIndustryId || form.studyAreaId || ''}
            disabled={locked}
            onChange={(e) => onChange({ subIndustryId: e.target.value })}
          >
            <option value="">Select subject</option>
            {subjectOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </FilledField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FilledField label="Intake">
            <select
              className={FILLED_SELECT}
              style={FILLED_SELECT_BG}
              value={form.intakeMonth}
              disabled={locked}
              onChange={(e) => onChange({ intakeMonth: e.target.value })}
            >
              <option value="">Select intake</option>
              {INTAKE_MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </FilledField>
          <FilledField label="Intake Year">
            <select
              className={FILLED_SELECT}
              style={FILLED_SELECT_BG}
              value={form.intakeYear}
              disabled={locked}
              onChange={(e) => onChange({ intakeYear: e.target.value })}
            >
              <option value="">Select year</option>
              {INTAKE_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </FilledField>
        </div>

        <FilledField label="POC">
          <select
            className={FILLED_SELECT}
            style={FILLED_SELECT_BG}
            value={form.contactId}
            disabled={locked}
            onChange={(e) => onChange({ contactId: e.target.value })}
          >
            <option value="">Unassigned</option>
            {counsellors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </FilledField>
      </div>
    </div>
  );
}

const SCORE_FIELDS = [
  ['ieltsScore', 'IELTS'],
  ['toeflScore', 'TOEFL'],
  ['greScore', 'GRE'],
  ['gmatScore', 'GMAT'],
];

const SECTION_FIELDS = [
  ['type', 'Exam'],
  ['overall_score', 'Overall'],
  ['reading', 'Reading'],
  ['writing', 'Writing'],
  ['speaking', 'Speaking'],
  ['listening', 'Listening'],
];

export function ExamDetailsFields({ form, onChange, locked = false }) {
  const exams = form.asstExamSections?.length ? form.asstExamSections : [emptyExam()];

  const patchRow = (index, fields) => {
    const next = exams.map((row, i) => (i === index ? { ...row, ...fields } : row));
    onChange({ asstExamSections: next });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-neutral-800">Exam details</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SCORE_FIELDS.map(([key, label]) => (
          <FilledField key={key} label={label}>
            <input
              type="number"
              step="0.5"
              className={FILLED_INPUT}
              value={form[key] ?? ''}
              disabled={locked}
              onChange={(e) => onChange({ [key]: e.target.value })}
              placeholder="Score"
            />
          </FilledField>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Exam sections</p>
        {!locked ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700"
            onClick={() => onChange({ asstExamSections: [...exams, emptyExam()] })}
          >
            <Plus size={12} /> Add exam
          </button>
        ) : null}
      </div>
      {exams.map((row, index) => (
        <div key={`ex-${index}`} className="grid grid-cols-2 md:grid-cols-3 gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          {SECTION_FIELDS.map(([key, label]) => (
            <FilledField key={key} label={label}>
              <div className="flex gap-2">
                <input
                  className={FILLED_INPUT}
                  value={row[key] || ''}
                  disabled={locked}
                  onChange={(e) => patchRow(index, { [key]: e.target.value })}
                />
                {key === 'listening' && !locked && exams.length > 1 ? (
                  <button
                    type="button"
                    className="rounded-lg p-1 text-rose-500 hover:bg-rose-50"
                    onClick={() => onChange({ asstExamSections: exams.filter((_, i) => i !== index) })}
                    aria-label="Remove exam"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
            </FilledField>
          ))}
        </div>
      ))}
    </div>
  );
}
